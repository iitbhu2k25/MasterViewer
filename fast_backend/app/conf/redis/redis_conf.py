
from app.conf.settings import Settings
import asyncio
from typing import Optional
import redis.asyncio as aioredis
import redis
from redis.asyncio import ConnectionPool
from app.conf.logging import logger
sett=Settings()


class AsyncRedisSingleton:

    _instance: Optional["AsyncRedisSingleton"] = None
    _lock: asyncio.Lock = None  
    

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._redis: Optional[aioredis.Redis] = None
            cls._instance._pool: Optional[ConnectionPool] = None
            cls._instance._initialized: bool = False
        return cls._instance

    @classmethod
    def _get_lock(cls) -> asyncio.Lock:
        if cls._lock is None:
            cls._lock = asyncio.Lock()
        return cls._lock

    async def initialize(
        self,
        host: str = sett.REDIS_HOST,
        port: int =sett.REDIS_PORT,
        db: int = 0,
        username: str= sett.REDIS_USERNAME,
        password: str=sett.REDIS_PASSWORD,
        max_connections: int = 100,
        socket_timeout=None,
        socket_connect_timeout: float = 3.0,
        decode_responses: bool = True,
    ):
        """Async-safe lazy initialization with double-checked locking."""
        if self._initialized:
            return  # Fast path — no lock needed after init

        async with self._get_lock():
            if self._initialized:  # Double-check inside lock
                return

            logger.debug("[RedisSingleton] Creating connection pool...")
            self._pool = ConnectionPool(
                host=host,
                port=port,
                db=db,
                username=username,
                password=password,
                max_connections=max_connections,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout,
                decode_responses=decode_responses,
            )
            self._redis = aioredis.Redis(connection_pool=self._pool)

            # Validate connection on startup
            await self._redis.ping()
            self._initialized = True
            logger.info(f"[RedisSingleton] Connected to Redis at {host}:{port}, db={db}")

    @property
    def client(self) -> aioredis.Redis:
        """Return the Redis client. Must call initialize() first."""
        if not self._initialized or self._redis is None:
            raise RuntimeError(
                "RedisSingleton not initialized. Call await singleton.initialize() first."
            )
        return self._redis

    async def health_check(self) -> bool:
        """Ping Redis to check health."""
        try:
            result = await self._redis.ping()
            logger.debug(f"[RedisSingleton] Health check: {'OK' if result else 'FAIL'}")
            return result
        except Exception as e:
            logger.error(f"[RedisSingleton] Health check failed: {e}")
            return False

    async def close(self):
        """Gracefully close the connection pool."""
        if self._redis:
            await self._redis.aclose()
            logger.info("[RedisSingleton] Redis connection pool closed.")
            self._initialized = False
            self._redis = None
            self._pool = None

    @classmethod
    def reset(cls):
        """Reset singleton — USE ONLY IN TESTS."""
        cls._instance = None
        cls._lock = None
        logger.warning("[RedisSingleton] Instance reset (test use only).")


_singleton = AsyncRedisSingleton()

async def get_redis(
) -> aioredis.Redis:
    """Get the global Redis client, initializing if needed."""
    await _singleton.initialize()
    return _singleton.client



_sync_pool = redis.ConnectionPool(
    host=sett.REDIS_HOST,
    port=sett.REDIS_PORT,
    db=0,
    username=sett.REDIS_USERNAME,
    password=sett.REDIS_PASSWORD,
    decode_responses=True,
    max_connections=50,
)

def get_sync_redis() -> redis.Redis:
    return redis.Redis(connection_pool=_sync_pool)

async def close_redis():
    await _singleton.close()
