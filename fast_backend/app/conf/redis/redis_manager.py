from typing import Optional
import redis
import threading
from app.conf.redis.redis_conf import get_sync_redis


class RedisManager:

    _instance: Optional["RedisManager"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # double-check inside lock
                    cls._instance = super().__new__(cls)
                    cls._instance._redis = get_sync_redis()
        return cls._instance


   

    def client(self) -> redis.Redis:
        if self._redis is None:
            raise RuntimeError("RedisManager not initialized")
        return self._redis

    # -------------------
    # Redis Commands
    # -------------------
    def get(self, key: str):
        return self.client().get(key)

    def set(self, key: str, value, **kwargs):
        return self.client().set(key, value, **kwargs)

    def hset(self, key: str, **kwargs):
        return self.client().hset(key, **kwargs)
    def setex(self, key: str, ttl: int, value: str):
        return self.client().setex(key, ttl, value)

    def delete(self, key: str):
        return self.client().delete(key)

    def exists(self, key: str):
        return self.client().exists(key)

    def publish(self, channel: str, message: str):
        return self.client().publish(channel, message)

    def hgetall(self, key: str) -> dict:
        raw = self.client().hgetall(key)
        return {
            (k.decode("utf-8") if isinstance(k, bytes) else k):
            (v.decode("utf-8") if isinstance(v, bytes) else v)
            for k, v in raw.items()
        }


redis_manager = RedisManager()