from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Team, Challenge, Container, Submission, HintPurchase


class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email',)}),
        ('Team info', {'fields': ('team',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'team', 'is_staff')
    search_fields = ('username', 'email')
    list_filter = ('is_staff', 'is_superuser', 'is_active')


admin.site.register(User, CustomUserAdmin)
admin.site.register(Team)
admin.site.register(Challenge)
admin.site.register(Container)
admin.site.register(Submission)
admin.site.register(HintPurchase)
