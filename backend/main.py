from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict
import json

app = FastAPI(title="Secure E2E Messaging Backend")

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User connected: {user_id}")
        await self.broadcast_users()

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User disconnected: {user_id}")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast_users(self):
        users_list = list(self.active_connections.keys())
        msg = json.dumps({"type": "users", "users": users_list})
        for connection in self.active_connections.values():
            await connection.send_text(msg)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # The backend acts as a dumb relay for anything formatted as JSON
            # Expecting messages of format: {"target": "user2", "payload": "encrypted_blob", "type": "chat" | "key_exchange"}
            try:
                message = json.loads(data)
                target = message.get("target")
                
                # Attach the sender to the message so the receiver knows who it's from
                message["sender"] = user_id
                
                if target:
                    await manager.send_personal_message(json.dumps(message), target)
                else:
                    # If no target is specified, we might handle errors or broadcast, but let's require a target for E2E
                    pass
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_users()

@app.get("/")
def read_root():
    return {"status": "Backend running for E2E Chat"}
