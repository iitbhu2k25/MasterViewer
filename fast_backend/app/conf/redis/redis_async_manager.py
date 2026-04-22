from typing import Optional
import redis.asyncio as aioredis
from app.conf.redis.redis_conf import get_redis
import asyncio


class AsyncRedisManager:

    _instance: Optional["AsyncRedisManager"] = None
    _lock: asyncio.Lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._redis: Optional[aioredis.Redis] = None
        return cls._instance

    async def initialize(self):
        if self._redis is None:
            async with self._lock:
                if self._redis is None:
                    self._redis = await get_redis()

    def client(self) -> aioredis.Redis:
        if self._redis is None:
            raise RuntimeError("AsyncRedisManager not initialized")
        return self._redis

    # -------------------
    # Redis Commands
    # -------------------
    def pubsub(self):
        redis = self.client()
        return redis.pubsub()
    
    async def get(self, key: str):
        return await self.client().get(key)

    async def set(self, key: str, value, **kwargs):
        return await self.client().set(key, value, **kwargs)

    async def setex(self, key: str, ttl: int, value: str):
        return await self.client().setex(key, ttl, value)

    async def delete(self, key: str):
        return await self.client().delete(key)

    async def exists(self, key: str):
        return await self.client().exists(key)
    
    async def publish(self, channel: str, message: str):
        return await self.client().publish(channel, message)
    async def hgetall(self, key: str) -> dict:
        raw = await self.client().hgetall(key)
        return {
            (k.decode("utf-8") if isinstance(k, bytes) else k): 
            (v.decode("utf-8") if isinstance(v, bytes) else v)
            for k, v in raw.items()
        }


async_redis_manager = AsyncRedisManager()