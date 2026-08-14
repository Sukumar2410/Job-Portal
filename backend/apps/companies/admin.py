from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'company_size', 'is_verified', 'is_active')
    list_filter = ('is_verified', 'is_active', 'industry')
    search_fields = ('name', 'industry')
    prepopulated_fields = {'slug': ('name',)}