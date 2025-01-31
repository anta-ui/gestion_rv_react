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


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'register': reverse('register', request=request, format=format),
        'login': reverse('token_obtain_pair', request=request, format=format),
        'appointments': reverse('appointment-list', request=request, format=format),
        'stats': reverse('appointment-stats', request=request, format=format),
    })

@api_view(['POST'])
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
    upcoming_appointments = appointments.filter(date__gte=today).count()
    past_appointments = appointments.filter(date__lt=today).count()

    six_months_ago = today - timedelta(days=180)
    appointments_by_month = (
        appointments.filter(date__gte=six_months_ago)
        .values('date__month')
        .annotate(count=Count('id'))
        .order_by('date__month')
    )

    next_appointments = appointments.filter(
        date__gte=today
    ).order_by('date')[:5].values('title', 'date')

    # Formatage des heures et des minutes après récupération
    for appointment in next_appointments:
        appointment['time'] = appointment['date'].strftime('%H:%M')

    return Response({
        'total_appointments': total_appointments,
        'upcoming_appointments': upcoming_appointments,
        'past_appointments': past_appointments,
        'appointments_by_month': appointments_by_month,
        'next_appointments': list(next_appointments)
    })


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Appointment.objects.all()
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

