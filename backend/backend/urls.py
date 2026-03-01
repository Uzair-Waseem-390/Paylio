from django.http import HttpResponse
def home(request):
    return HttpResponse("Hello World")


from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('accounts/', include('accounts.urls'))
]