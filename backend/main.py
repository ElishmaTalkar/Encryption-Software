from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import json
from .database import init_db, save_offline_message, get_and_clear_pending_messages

app = FastAPI(title="Secure E2E Messaging Backend")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User connected: {user_id}")
        
        # Deliver any pending offline messages
        pending = get_and_clear_pending_messages(user_id)
        for msg in pending:
            await websocket.send_text(json.dumps(msg))
            
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
        for user_id, connection in list(self.active_connections.items()):
            try:
                await connection.send_text(msg)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            log_entry = f"\n[VAULT PULSE] Sender: {user_id} | Raw Data: {data}\n"
            print(log_entry)
            with open("vault_relay.log", "a") as f:
                f.write(log_entry)
            # The backend acts as a dumb relay for anything formatted as JSON
            # Expecting messages of format: {"target": "user2", "payload": "encrypted_blob", "type": "chat" | "key_exchange"}
            try:
                message = json.loads(data)
                target = message.get("target")
                
                # Attach the sender to the message so the receiver knows who it's from
                message["sender"] = user_id
                
                if target:
                    # If target is online, send immediately
                    if target in manager.active_connections:
                        await manager.send_personal_message(json.dumps(message), target)
                    else:
                        # Otherwise, queue for offline delivery
                        save_offline_message(
                            target_id=target,
                            sender_id=user_id,
                            payload=message.get("payload", ""),
                            msg_type=message.get("type", "chat")
                        )
                else:
                    # If no target is specified, we might handle errors or broadcast
                    pass
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_users()

@app.get("/")
def read_root():
    return {"status": "Backend running for E2E Chat"}
