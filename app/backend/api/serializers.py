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
        fields = ['title', 'description', 'date', 'type']

    def validate(self, data):
        # Convertir la date en datetime aware
        if 'date' in data:
            appointment_datetime = data['date']
            if timezone.is_naive(appointment_datetime):
                appointment_datetime = timezone.make_aware(appointment_datetime)
            data['date'] = appointment_datetime
        return data