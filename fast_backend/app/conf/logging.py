import os
import logging
from logging.config import dictConfig
from pathlib import Path

SERVICE_TYPE = os.getenv("SERVICE_TYPE", "app")

log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

LOG_FILE = "logs/app.log" if SERVICE_TYPE == "app" else "logs/celery.log"

log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "level": "INFO",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "standard",
            "filename": LOG_FILE,
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8",
            "level": "INFO",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "standard",
            "filename": "logs/errors.log",
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 3,
            "encoding": "utf-8",
            "level": "ERROR",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file", "error_file"],
    },
    "loggers": {
        "uvicorn": {
            "level": "INFO",
            "propagate": True,
        },
        "celery": {
            "level": "INFO",
            "propagate": True,
        },
        "celery.task": {
            "level": "INFO",
            "propagate": True,
        },
    },
}

dictConfig(log_config)

logger = logging.getLogger(__name__)
logger.info(f"Logging initialized for {SERVICE_TYPE}")