from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, Team, Challenge, Container, Submission

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'team', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'role', 'team')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'team', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')

admin.site.register(User, CustomUserAdmin)
admin.site.register(Role)
admin.site.register(Team)
admin.site.register(Challenge)
admin.site.register(Container)
admin.site.register(Submission)
