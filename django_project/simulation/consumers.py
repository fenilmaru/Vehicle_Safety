from channels.generic.websocket import AsyncWebsocketConsumer
import json, random

class VehicleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.vehicle_id = self.scope['url_route']['kwargs']['vehicle_id']
        self.room_name = f"vehicle_{self.vehicle_id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()
        await self.send(json.dumps({"event":"connected","data":{"vehicleId":self.vehicle_id,"channel":f"ws/vehicle/{self.vehicle_id}"}}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def vehicle_event(self, event):
        await self.send(text_data=json.dumps({"event": event["type"], "data": event["data"]}))
