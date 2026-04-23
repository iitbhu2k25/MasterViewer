from fastapi import status
from fastapi.exceptions import HTTPException
from app.api.exception.exceptions import EmailAlreadyExistsException,CustomException
from functools import wraps
def validate(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return  await func(*args, **kwargs)
        except EmailAlreadyExistsException as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        except CustomException as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

        except Exception as e:
            print("error is here",e)
            if "No clusters found" in str(e):
                raise HTTPException(status_code=status.HTTP_204_NO_CONTENT,detail=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    return wrapper