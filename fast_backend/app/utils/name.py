from datetime import datetime
import uuid
class Unique_name:
    @staticmethod
    def unique_name_with_ext(name: str, extension: str) -> str:
        ext =f".{extension}"
        unique = uuid.uuid4().hex 
        return f"{name}_{unique}{ext}"
    
    @staticmethod
    def unique_name(name: str) -> str:
        unique = uuid.uuid4().hex 
        return f"{name}_{unique}"