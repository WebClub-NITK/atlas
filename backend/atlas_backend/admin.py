from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Team, Challenge, Container, Submission


class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "get_role",
        "team",
        "is_staff",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "is_staff",
        "is_superuser",
        "groups",
        "team",
    )
    fieldsets = UserAdmin.fieldsets + (
        (
            "Custom Fields",
            {"fields": ("role", "team", "created_at", "updated_at")},
        ),
    )
    readonly_fields = ("created_at", "updated_at")

    def get_role(self, obj):
        return (
            ", ".join([group.name for group in obj.groups.all()])
            if obj.groups.exists()
            else "No Role"
        )

    get_role.short_description = "Role"


admin.site.register(User, CustomUserAdmin)
admin.site.register(Team)
admin.site.register(Challenge)
admin.site.register(Container)
admin.site.register(Submission)
