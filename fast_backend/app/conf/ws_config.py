import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from typing import Dict, Set
from app.conf.logging import logger


async def safe_send(ws: WebSocket, message: dict):
    if ws.application_state != WebSocketState.CONNECTED:
        return False

    try:
        await ws.send_json(message)
        return True

    except (RuntimeError, WebSocketDisconnect):
        logger.debug("WebSocket closed during send.")
        return False

    except Exception:
        logger.exception("Unexpected websocket send error")
        return False


class ConnectionManager:

    def __init__(self):
        self._task_clients: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, task_id: str):
        async with self._lock:
            self._task_clients.setdefault(task_id, set()).add(websocket)

    async def disconnect(self, websocket: WebSocket, task_id: str):
        async with self._lock:
            clients = self._task_clients.get(task_id)

            if not clients:
                return

            clients.discard(websocket)

            if not clients:
                self._task_clients.pop(task_id, None)

    async def clients_for(self, task_id: str):
        async with self._lock:
            return set(self._task_clients.get(task_id, set()))

    async def broadcast(self, task_id: str, message: dict):
        

        clients = await self.clients_for(task_id)

        if not clients:
            return

        dead_clients = []

        for ws in clients:

            ok = await safe_send(ws, message)

            if not ok:
                dead_clients.append(ws)

        if dead_clients:
            async with self._lock:
                for ws in dead_clients:
                    self._task_clients.get(task_id, set()).discard(ws)



connection_manager=ConnectionManager()