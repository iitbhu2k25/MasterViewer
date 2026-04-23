from app.conf.settings import Settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,scoped_session

DB_URL = Settings().DATABSE_URL
email_server=Settings().email_conf
engine = create_engine(DB_URL,pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
sessions=scoped_session(SessionLocal)

