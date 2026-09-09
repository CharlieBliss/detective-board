import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://detective:detective@localhost:5432/detective_board",
    )
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )
    VERCEL_URL: str = os.getenv("VERCEL_URL", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @property
    def allowed_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]
        if self.VERCEL_URL:
            vercel_url = self.VERCEL_URL.strip()
            if not vercel_url.startswith("http://") and not vercel_url.startswith("https://"):
                origins.append(f"https://{vercel_url}")
            else:
                origins.append(vercel_url)
        # Always allow wildcard in dev or add standard dev origins
        return list(set(origins))

settings = Settings()
