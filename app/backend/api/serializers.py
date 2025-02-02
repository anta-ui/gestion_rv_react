from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Appointment
from django.utils import timezone  # Pour manipuler les fuseaux horaires
from datetime import datetime



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

from datetime import time

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id','title', 'description', 'date', 'type','status']

    def validate(self, data):
        if 'date' in data:
            appointment_datetime = data['date']
            if timezone.is_naive(appointment_datetime):
                appointment_datetime = timezone.make_aware(appointment_datetime)
            data['date'] = appointment_datetime

            if appointment_datetime < timezone.now():
                raise serializers.ValidationError("Impossible de créer un rendez-vous dans le passé")

            day = appointment_datetime.weekday()
            hour = appointment_datetime.hour
            
            valid_slots = {
                0: [(8, 13), (15, 18)],  # Lundi
                1: [(8, 13), (15, 18)],  # Mardi
                2: [(8, 13), (15, 18)],  # Mercredi
                3: [(8, 13), (15, 18)],  # Jeudi
                4: [(8, 13), (15, 18)],  # Vendredi
                5:[(9,13)] ,# samedi
            }
            
            if day in valid_slots:
                if not any(start <= hour < end for start, end in valid_slots[day]):
                    raise serializers.ValidationError("Créneau horaire invalide")
            else:
                raise serializers.ValidationError("Rendez-vous impossible les week-ends")
        
        return data