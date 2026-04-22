
from fastapi import HTTPException, status

class EmailAlreadyExistsException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or fullname already exists"
        )
class CustomException(HTTPException):
    def __init__(self, status_code, detail = None, headers = None):
        super().__init__(status_code, detail, headers)

class UserNotRegistered(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is not registered"
        )

class InvalidOtp(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

class PasswordFail(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password or email is incorrected",
            headers={"WWW-Authenticate": "Bearer"},
        )

class WeakPasswordException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet strength requirements"
        )

class SessionServerError(HTTPException):
    def __init__(self, CustomExceptionDetail:str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"{CustomExceptionDetail}"
        )
class TokenNone(HTTPException):
    def __init__(self,CustomExceptionDetail ):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED,
                         detail=f"{CustomExceptionDetail}")
class Invalid_Token(HTTPException):
    def __init__(self,CustomExceptionDetail ):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED,
                         detail=f"{CustomExceptionDetail}")
class InternalServerError(HTTPException):
    def __init__(self, CustomExceptionDetail):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{CustomExceptionDetail}"
        )