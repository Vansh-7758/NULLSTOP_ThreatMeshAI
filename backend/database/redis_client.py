import redis.asyncio as aioredis
import logging
from config import settings
import asyncio

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis = None

    async def connect(self):
        try:
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis connection deferred: {e}")
        return self

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def health_check(self) -> bool:
        try:
            return await self.redis.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    async def cache_get(self, key: str) -> str | None:
        for attempt in range(2):
            try:
                return await self.redis.get(key)
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Redis cache_get failed: {e}")
                    raise
                logger.warning(f"Redis cache_get retrying: {e}")
                await asyncio.sleep(1)

    async def cache_set(self, key: str, value: str, ttl: int = 3600):
        for attempt in range(2):
            try:
                await self.redis.set(key, value, ex=ttl)
                return
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Redis cache_set failed: {e}")
                    raise
                logger.warning(f"Redis cache_set retrying: {e}")
                await asyncio.sleep(1)

    async def publish(self, channel: str, message: str):
        for attempt in range(2):
            try:
                await self.redis.publish(channel, message)
                return
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Redis publish failed: {e}")
                    raise
                logger.warning(f"Redis publish retrying: {e}")
                await asyncio.sleep(1)

    async def subscribe(self, channel: str):
        for attempt in range(2):
            try:
                pubsub = self.redis.pubsub()
                await pubsub.subscribe(channel)
                return pubsub
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Redis subscribe failed: {e}")
                    raise
                logger.warning(f"Redis subscribe retrying: {e}")
                await asyncio.sleep(1)
