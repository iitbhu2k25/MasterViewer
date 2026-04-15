from sqlalchemy.orm import Session
from fastapi import HTTPException
import sqlalchemy as sq

class CrudBase:
    def __init__(self,db:Session,Model=None):
        self.db=db
        self.Model=Model
        self.obj=None

    def _missing_obj(self,obj,_id:int=0):
        if obj is None:
            raise HTTPException(
                status_code=404,
                detail=f"detail not found for {_id} object"
            )

    def _pagination(self, query,all_data:bool=False, page=1, page_size=5):
        if all_data:
            return query.all()
        if page_size:
            query = query.limit(page_size)
        if page - 1:
            query = query.offset((page-1)*page_size)
        return query.all()
    
    def get(self,id:int):
        self.obj=self.db.query(self.Model).filter(
            self.Model.id == id).first()
        self._missing_obj(self.obj,id)
        return self.obj
    
    
    
    def get_all(self,all_data:bool=False,page=1, page_size=5):
        query= self.db.query(self.Model).filter().order_by(
            sq.desc(self.Model.modified_at))
        return self._pagination(query,all_data,page,page_size)
    

    def create(self,data:dict):
        obj=self.Model(**data)
        self.db.add(obj)
        return self.commit(obj)

    def __update_obj(self,obj,data:dict):
        self._missing_obj(obj,data.get('id',0))
        if 'id' in data:data.pop('id')
        for key, value in data.items():
            setattr(obj,key,value)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self,data:dict):
        obj = self.db.query(self.Model).filter(self.Model.id == data.get('id')).first()
        return self.__update_obj(obj,data)
    
    def update_email(self,data:dict):
        obj = self.db.query(self.Model).filter(self.Model.email == data.get('email')).first()
        return self.__update_obj(obj,data)
    

    def __delete_obj(self,obj):
        self._missing_obj(obj)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False

    def delete(self,id:int):
        obj=self.get(id)
        return self.__delete_obj(obj=obj)
        

    def commit(self,obj):
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update_many():
        pass
    def create_many():
        pass
