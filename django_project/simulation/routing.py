from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from . import consumers

urlpatterns = [
    re_path(r'ws/vehicle/(?P<vehicle_id>\d+)/$', consumers.VehicleConsumer.as_asgi()),
]
