from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket connection established.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket connection disconnected.")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to websocket: {e}")
                dead_connections.append(connection)
        
        for conn in dead_connections:
            self.disconnect(conn)

    async def send_trust_update(self, package_name: str, version: str, old_score: float, new_score: float, node_type: str):
        event = {
            "type": "TrustUpdateEvent",
            "data": {
                "package_name": package_name,
                "version": version,
                "old_score": old_score,
                "new_score": new_score,
                "node_type": node_type
            }
        }
        await self.broadcast(event)

    async def send_live_event(self, event_type: str, title: str, description: str, severity: str, data: dict):
        event = {
            "type": "LiveFeedEvent",
            "event_type": event_type,
            "title": title,
            "description": description,
            "severity": severity,
            "data": data
        }
        await self.broadcast(event)

manager = ConnectionManager()
