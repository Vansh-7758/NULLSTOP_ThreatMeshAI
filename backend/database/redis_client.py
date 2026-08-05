# backend/database/redis_client.py
import redis.asyncio as aioredis
import logging
import asyncio
from config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis = None
        self._in_memory_cache: dict[str, str] = {}

    async def connect(self):
        try:
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis.ping()
        except Exception as e:
            logger.warning(f"Redis connection deferred (using in-memory fallback): {e}")
            self.redis = None
        return self

    async def close(self):
        if self.redis:
            try:
                await self.redis.close()
            except Exception:
                pass

    async def health_check(self) -> bool:
        if not self.redis:
            return False
        try:
            return await self.redis.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    async def cache_get(self, key: str) -> str | None:
        if self.redis:
            try:
                return await self.redis.get(key)
            except Exception as e:
                logger.warning(f"Redis cache_get fallback: {e}")

        return self._in_memory_cache.get(key)

    async def cache_set(self, key: str, value: str, ttl: int = 3600):
        self._in_memory_cache[key] = value
        if self.redis:
            try:
                await self.redis.set(key, value, ex=ttl)
            except Exception as e:
                logger.warning(f"Redis cache_set fallback: {e}")

    async def publish(self, channel: str, message: str):
        if self.redis:
            try:
                await self.redis.publish(channel, message)
            except Exception as e:
                logger.warning(f"Redis publish fallback: {e}")

    async def subscribe(self, channel: str):
        if self.redis:
            try:
                pubsub = self.redis.pubsub()
                await pubsub.subscribe(channel)
                return pubsub
            except Exception as e:
                logger.warning(f"Redis subscribe fallback: {e}")

        return None
