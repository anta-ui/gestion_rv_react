from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer, AppointmentSerializer
from .models import Appointment
from rest_framework.reverse import reverse
from django.utils import timezone  # Pour utiliser les fonctions de gestion des fuseaux horaires
from django.db.models import Count
from datetime import timedelta
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse 
from .models import CanceledAppointment
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.core.exceptions import ValidationError

import logging

logger = logging.getLogger(__name__)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            # Le superutilisateur voit tous les rendez-vous
            return Appointment.objects.all()
        else:
            # Les utilisateurs normaux ne voient que leurs propres rendez-vous
            return Appointment.objects.filter(user=user)

    def perform_create(self, serializer):
        try:
            # Récupération de la date du rendez-vous et vérifier si elle est "aware"
            appointment_date = serializer.validated_data.get('date')
            if appointment_date and timezone.is_naive(appointment_date):
                appointment_date = timezone.make_aware(appointment_date)

            # Vérification de la validité du créneau horaire
            if not self.is_valid_time_slot(appointment_date):
                raise ValidationError("L'heure du rendez-vous n'est pas valide.")
            
            # Vérification qu'il n'y a pas déjà un rendez-vous à la même date et heure
            if Appointment.objects.filter(date=appointment_date, user=self.request.user).exists():
                raise ValidationError("Un rendez-vous existe déjà à cette heure.")

            # Enregistrer le rendez-vous
            appointment = serializer.save(user=self.request.user, date=appointment_date)
            
            # Envoi de l'email de confirmation
            send_appointment_email(appointment, 'create')
            
        except Exception as e:
            print(f"Erreur lors de la création du rendez-vous: {str(e)}")
            raise ValidationError(f"Erreur lors de la création du rendez-vous: {str(e)}")

    def is_valid_time_slot(self, date):
        # Implémentez la logique de validation des créneaux horaires ici
        day_of_week = date.weekday()
        hour = date.hour
        minute = date.minute

        if day_of_week == 5:  # Vendredi
            if (hour < 8 or (hour == 13 and minute > 30)) and (hour < 15 or (hour == 18 and minute > 0)):
                return False
        elif day_of_week in [0, 1, 2, 3, 4]:  # Lundi à jeudi
            if (hour < 8 or (hour == 14 and minute > 0)) and (hour < 15 or (hour == 18 and minute > 0)):
                return False
        return True
@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'register': reverse('register', request=request, format=format),
        'login': reverse('token_obtain_pair', request=request, format=format),
        'appointments': reverse('appointment-list', request=request, format=format),
        'stats': reverse('appointment-stats', request=request, format=format),
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_stats(request):
    today = timezone.now().date()

    if request.user.is_superuser:
        appointments = Appointment.objects.all()
    else:
        appointments = Appointment.objects.filter(user=request.user)
    
    total_appointments = appointments.count()
    upcoming_appointments = appointments.filter(
        date__gte=today,
        status='active'  # Ajout du filtre status
    ).count()
    past_appointments = appointments.filter(
        date__lt=today,
        status='active'  # Ajout du filtre status
    ).count()
    canceled_appointments = appointments.filter(
        status='cancelled'  # Comptage des rendez-vous annulés
    ).count()

    six_months_ago = today - timedelta(days=180)
    appointments_by_month = (
        appointments.filter(date__gte=six_months_ago)
        .values('date__month')
        .annotate(count=Count('id'))
        .order_by('date__month')
    )

    return Response({
        'total_appointments': total_appointments,
        'upcoming_appointments': upcoming_appointments,
        'past_appointments': past_appointments,
        'canceled_appointments': canceled_appointments,  # Ajout dans la réponse
        'appointments_by_month': appointments_by_month
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_stats(request):
    today = timezone.now().date()

    # Filtrer les rendez-vous de l'utilisateur
    if request.user.is_superuser:
        appointments = Appointment.objects.all()
    else:
        appointments = Appointment.objects.filter(user=request.user)
    
    # Comptage des rendez-vous
    total_appointments = appointments.count()
    
    # Rendez-vous à venir
    upcoming_appointments = appointments.filter(
        date__gte=today,
        status='active'  # Seulement les rendez-vous en cours
    ).count()
    
    # Rendez-vous passés
    past_appointments = appointments.filter(
        date__lt=today,
        status='active'  # Seulement les rendez-vous en cours
    ).count()
    
    # Rendez-vous annulés
    canceled_appointments = appointments.filter(
        status='cancelled'  # Comptage des rendez-vous annulés
    ).count()

    # Rendez-vous annulés dans un tableau séparé
    canceled_appointments_list = appointments.filter(
        status='cancelled'
    )
    
    six_months_ago = today - timedelta(days=180)
    appointments_by_month = (
        appointments.filter(date__gte=six_months_ago)
        .values('date__month')
        .annotate(count=Count('id'))
        .order_by('date__month')
    )

    # Retourner les statistiques
    return Response({
        'total_appointments': total_appointments,
        'upcoming_appointments': upcoming_appointments,
        'past_appointments': past_appointments,
        'canceled_appointments': canceled_appointments,  # Ajout dans la réponse
        'appointments_by_month': appointments_by_month,
        'canceled_appointments_list': canceled_appointments_list.values('id', 'date')  # Liste des rendez-vous annulés
    })

from .models import CanceledAppointment  # Assurez-vous que CanceledAppointment est bien défini

import logging

logger = logging.getLogger(__name__)

def send_appointment_email(appointment, action_type):
    """
    Fonction utilitaire pour envoyer des emails
    """
    subject_map = {
        'create': 'Nouveau rendez-vous confirmé',
        'cancel': 'Annulation de rendez-vous',
        'update': 'Modification de rendez-vous'
    }
    
    message = f"""
    Cher(e) {appointment.user.username},
    
    {subject_map[action_type]} pour la date du {appointment.date.strftime('%d/%m/%Y à %H:%M')}.
    
    Description: {appointment.description}
    
    Cordialement,
    L'équipe 5sursync
    """
    
    send_mail(
        subject=subject_map[action_type],
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.user.email],
        fail_silently=False,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_appointment(request, appointment_id):
    try:
        # Ajouter des logs
        print(f"Tentative d'annulation du rendez-vous {appointment_id}")
        
        appointment = get_object_or_404(Appointment, id=appointment_id, user=request.user)
        print(f"État initial du rendez-vous : {appointment.status}")
        
        appointment.status = 'cancelled'
        appointment.save()
        
        # Vérifier que le changement a été sauvegardé
        appointment.refresh_from_db()
        print(f"État après sauvegarde : {appointment.status}")
        
        # Envoi de l'email d'annulation
        send_appointment_email(appointment, 'cancel')
        
        return JsonResponse({
            "status": "success",
            "message": "Rendez-vous annulé avec succès",
            "appointment": {
                "id": appointment.id,
                "status": appointment.status
            }
        })
    except Exception as e:
        print(f"Erreur lors de l'annulation : {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=400)


from django.utils.dateparse import parse_datetime

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_appointment(request, appointment_id):
    try:
        # Récupérer le rendez-vous
        appointment = get_object_or_404(Appointment, id=appointment_id, user=request.user)
        
        # Copier les données de la requête
        data = request.data.copy()
        
        # Convertir la date si elle est présente
        if 'date' in data:
            try:
                # Parser la date reçue
                date = parse_datetime(data['date'])
                if date is None:
                    raise ValidationError("Format de date invalide")
                    
                # S'assurer que la date est "aware" (avec fuseau horaire)
                if timezone.is_naive(date):
                    date = timezone.make_aware(date)
                    
                data['date'] = date
            except Exception as e:
                raise ValidationError(f"Erreur de conversion de la date: {str(e)}")
        
        # Utiliser le sérialiseur avec les données converties
        serializer = AppointmentSerializer(appointment, data=data, partial=True)
        
        if serializer.is_valid():
            # Sauvegarder les modifications
            updated_appointment = serializer.save()
            
            try:
                # Envoyer l'email
                send_appointment_email(updated_appointment, 'update')
                logger.info(f"Email envoyé avec succès pour le rendez-vous {appointment_id}")
            except Exception as mail_error:
                logger.error(f"Erreur d'envoi d'email pour le rendez-vous {appointment_id}: {str(mail_error)}")
            
            return JsonResponse({
                "status": "success",
                "message": "Rendez-vous modifié avec succès",
                "appointment": serializer.data
            })
        
        return JsonResponse({
            "status": "error",
            "message": "Données invalides",
            "errors": serializer.errors
        }, status=400)
            
    except ValidationError as ve:
        logger.error(f"Erreur de validation pour le rendez-vous {appointment_id}: {str(ve)}")
        return JsonResponse({
            "status": "error",
            "message": str(ve)
        }, status=400)
    except Exception as e:
        logger.error(f"Erreur inattendue dans update_appointment pour le rendez-vous {appointment_id}: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": "Une erreur est survenue lors de la mise à jour du rendez-vous."
        }, status=500)

@api_view(['GET'])
def appointment_detail(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=404)

    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data)


from rest_framework.permissions import AllowAny

import logging
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
import socket

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def test_email(request):
    try:
        logger.info("Démarrage du test d'envoi d'email")
        
        # Test de connexion SMTP
        logger.info(f"Test de connexion SMTP à {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((settings.EMAIL_HOST, settings.EMAIL_PORT))
        if result != 0:
            raise Exception(f"Impossible de se connecter au serveur SMTP {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        sock.close()
        
        test_email = "canta699@gmail.com"
        logger.info(f"Tentative d'envoi d'email à {test_email}")
        
        # Création de l'email avec plus de détails
        email = EmailMessage(
            subject='Test Email',
            body='Ceci est un message de test',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[test_email],
        )
        
        # Configuration debug
        email.connection.set_debug_level(1)
        
        # Envoi de l'email
        email.send(fail_silently=False)
        
        logger.info("Email envoyé avec succès")
        
        return JsonResponse({
            "status": "success",
            "message": f"Email envoyé avec succès à {test_email}",
            "configuration": {
                "host": settings.EMAIL_HOST,
                "port": settings.EMAIL_PORT,
                "use_tls": settings.EMAIL_USE_TLS,
                "from_email": settings.DEFAULT_FROM_EMAIL
            }
        })
        
    except socket.error as e:
        logger.error(f"Erreur de connexion SMTP: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": f"Erreur de connexion au serveur SMTP: {str(e)}",
            "type": "connection_error"
        }, status=500)
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi d'email: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e),
            "configuration": {
                "host": settings.EMAIL_HOST,
                "port": settings.EMAIL_PORT,
                "use_tls": settings.EMAIL_USE_TLS,
                "from_email": settings.DEFAULT_FROM_EMAIL
            }
        }, status=500)


def get_serializer_context(self):
    context = super().get_serializer_context()
    context['request'] = self.request
    return context