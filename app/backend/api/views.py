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

import logging

logger = logging.getLogger(__name__)



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

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointment.objects.filter(user=self.request.user)
    
    from rest_framework.exceptions import ValidationError

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
            serializer.save(user=self.request.user, date=appointment_date)
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

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_appointment(request, appointment_id):  # Le paramètre doit correspondre à l'URL
    try:
        appointment = get_object_or_404(Appointment, id=appointment_id)
        
        # Mettre à jour les champs du rendez-vous
        if 'date' in request.data:
            appointment.date = request.data['date']
        if 'description' in request.data:
            appointment.description = request.data['description']
        
        appointment.save()
        
        return JsonResponse({
            "status": "success",
            "message": "Rendez-vous modifié avec succès",
            "appointment": {
                "id": appointment.id,
                "date": appointment.date,
                "description": appointment.description
            }
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=400)


@api_view(['GET'])
def appointment_detail(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=404)

    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data)