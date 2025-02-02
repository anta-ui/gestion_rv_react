# models.py
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


# models.py
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
    ]
    title = models.CharField(max_length=255,blank=True,null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE,blank=True,null=True)
    date = models.DateTimeField(blank=True,null=True)
    description = models.TextField(blank=True,null=True)
    type = models.CharField(max_length=255,blank=True,null=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active'
    )
    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        get_latest_by = 'date'

class CanceledAppointment(models.Model):
    appointment = models.ForeignKey('Appointment', on_delete=models.CASCADE,blank=True, null=True)
    cancelled_at = models.DateTimeField(auto_now_add=True,blank=True, null=True)

    def __str__(self):
        return f"Annulation du RDV {self.appointment.id} à {self.cancelled_at}"