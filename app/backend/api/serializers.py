from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Appointment
from django.utils import timezone
from datetime import datetime, time

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('id', 'date', 'description', 'status', 'user')
        read_only_fields = ('user', 'status')
        
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
                5: [(9, 13)],  # samedi
            }
            
            if day in valid_slots:
                if not any(start <= hour < end for start, end in valid_slots[day]):
                    raise serializers.ValidationError("Créneau horaire invalide")
            else:
                raise serializers.ValidationError("Rendez-vous impossible les week-ends")
        
        # Validation de la description
        if 'description' not in data or not data['description']:
            data['description'] = "Aucune description"
            
        return data
        
    def create(self, validated_data):
        """
        S'assurer que l'utilisateur est bien associé lors de la création
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)
        
    def to_representation(self, instance):
        """
        Personnaliser l'affichage des données
        """
        representation = super().to_representation(instance)
        
        # S'assurer que la description n'est jamais None
        if representation['description'] is None:
            representation['description'] = "Aucune description"
            
        return representation