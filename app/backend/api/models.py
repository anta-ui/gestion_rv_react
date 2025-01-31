# models.py
from django.db import models
from django.contrib.auth.models import User

class Appointment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateTimeField()
    type = models.CharField(max_length=100, blank=True, null=True)  # Ajout du champ type
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        # Ce paramètre indique que ce modèle doit respecter les fuseaux horaires
        get_latest_by = 'date'
