from app.database.config.session import sessions
import logging
from sqlalchemy.orm import Session
from fastapi import Depends
from contextlib import contextmanager
from typing import Annotated

class PostgresDb():
    def __init__(self):
        self.session = sessions
    
    @contextmanager
    def session(self):
        self.session()
        try:
            yield self.session
        except Exception as e:
            self.session.rollback()
            raise
        finally:
            self.session.remove()
            
    def get_session(self):
        session = self.session()
        try:
            yield session
        except Exception as e:
            session.rollback()
            raise
        finally:
            session.close()

db_dependency = Annotated[Session, Depends(PostgresDb().get_session, use_cache=False)]

@contextmanager
def celery_session():
    session = sessions()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        sessions.remove() 