import os
from pydantic_settings import BaseSettings
from decouple import config
from sqlalchemy import URL
from pydantic import AnyHttpUrl,Field,computed_field
import redis

def get_db_url(drivername,username,password,host,database,port)->str:
    return URL.create(
        drivername=drivername,
        username=username,
        password=password,
        host=host,
        database=database,
        port=port,
    )

class Settings(BaseSettings):
    # geoserver
    GEOSERVER_URL:str
    GEOSERVER_USERNAME:str
    GEOSERVER_PASSWORD:str 
    GEOSERVER_WORKSPACE:str 
    # postgres
    
    POSTGRES_DB:str
    POSTGRES_HOST:str
    POSTGRES_USER:str
    POSTGRES_PASSWORD:str
    POSTGRES_PORT:int
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    TEMP_DIR:str = os.path.dirname(BASE_DIR)+'/temp'

    DATABSE_URL:AnyHttpUrl = Field(get_db_url(
        drivername="postgresql+psycopg2",
        username=config("POSTGRES_USER"),
        password=config("POSTGRES_PASSWORD"),
        host=config("POSTGRES_HOST"),
        database=config("POSTGRES_DB"),
        port=config("POSTGRES_PORT"),
    ),validate_default=False)

   
    class config:
        env_file = ".env"

