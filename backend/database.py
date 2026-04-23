import sqlite3
import json
import os
from datetime import datetime

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), "messages.db")

def init_db():
    """Initializes the SQLite database and creates the messages table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pending_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            msg_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_offline_message(target_id, sender_id, payload, msg_type):
    """Saves an encrypted message blob for an offline user."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pending_messages (target_id, sender_id, payload, msg_type)
        VALUES (?, ?, ?, ?)
    """, (target_id, sender_id, payload, msg_type))
    conn.commit()
    conn.close()
    print(f"Queued message for offline user: {target_id}")

def get_and_clear_pending_messages(target_id):
    """Retrieves all pending messages for a user and deletes them from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Fetch messages
    cursor.execute("SELECT sender_id, payload, msg_type FROM pending_messages WHERE target_id = ?", (target_id,))
    rows = cursor.fetchall()
    
    messages = []
    for row in rows:
        messages.append({
            "sender": row[0],
            "payload": row[1],
            "type": row[2]
        })
    
    # Delete fetched messages
    if messages:
        cursor.execute("DELETE FROM pending_messages WHERE target_id = ?", (target_id,))
        conn.commit()
        print(f"Delivered and cleared {len(messages)} pending messages for: {target_id}")
    
    conn.close()
    return messages
