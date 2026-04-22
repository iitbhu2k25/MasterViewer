from pydantic import BaseModel,Field,model_validator
from typing import Annotated,List,Optional,Text, Tuple


class Stp_response(BaseModel):
    id:int
    name:str
    
    
    class Config:
        from_attributes = True

class Stp_town_respons(Stp_response):
    population:int
    subdistrict_code:int
    latitude:float
    longitude:float


class District_request(BaseModel):
    state:int
    all_data: bool = True
    
    class Config:
        from_attributes = True
    
class Sub_district_request(BaseModel):
    districts:Annotated[List[int],None]
    all_data: bool = True
    
    class Config:
        from_attributes = True



class RasterVisualOutput(BaseModel):
    workspace:str
    layer_name:str
    file_name:str
    
class STPPriorityVisualOutput(BaseModel):
    raster_layer:Annotated[List[RasterVisualOutput],None]
    vector_layer:str
class STPSuitabilityVisualOutput(BaseModel):
    raster_layer:Annotated[List[RasterVisualOutput],None]
    vector_layer:str
    
class STPRasterInputt(BaseModel):
    id: int
    weight: float

class STPClassification(BaseModel):
    workspace:str
    store:str
    layer_name:str
    
    class Config:
        from_attributes = True

class STP_suitability_Area(BaseModel):
    treatment_technology:float
    mld_capacity:float
    custom_land_per_mld: float = Field(2.0, le=2) 
    layer_name:str
    location:List[Tuple[float, float]]
    
class Raster_operation_input(BaseModel):
    id :int
    file_name: str
    Influence: str
    weight: float  

    class Config:
        from_attributes = True

class GWPL_Table_input(BaseModel):
    location:list
    raster_name:str
    village_layer:str

class GWPL_Table_output(BaseModel):
    well_id: str = Field(..., alias="Well_id")
    groundwater_table: float = Field(..., alias="Groundwater table")
    groundwater_trends: float = Field(..., alias="Groundwater trends")
    slope: float = Field(..., alias="Slope")
    specific_yield: float = Field(..., alias="Specific yield")
    slope_per_year: float = Field(..., alias="slope per year")
    rank: int = Field(..., alias="Rank")
    name:str = Field(..., alias="Name")

    class Config:
        from_attributes = True
        populate_by_name = True

class GWPL_output(BaseModel):
    table : List[GWPL_Table_output]
    well_points : list

class STPsuitabilityInput(BaseModel):
    data: List[Raster_operation_input] = None
    clip: List[int] = None
    all_data: bool = True
    place: str = None
    drain_clip:Optional[List[int]]=None
    village_layer: str = None



class STPCategory(BaseModel):
    data: List[Raster_operation_input] = None
    clip: List[int] = None
    all_data: bool = True
    place: str = None
    village_layer: str = None


class STPPriorityOutput(BaseModel):
    weight: float
    file_name: str
    id: int 
    details:Text

    class Config:
        from_attributes = True

class Stp_Area(BaseModel):
    id: int
    tech_name:str
    tech_value:float

class STPsuitabilityOutput(STPPriorityOutput):
    raster_category: str  

    class Config:
        from_attributes = True
    
class MARsuitabilityOutput(STPsuitabilityOutput):
    needed:str 

    class Config:
        from_attributes = True

class category_raster(BaseModel):
    clip:List[int]=None
    place:str=None
    layer_name:str=None

class STPRiverOutput(BaseModel):
    River_Name: str
    River_Code:int

class STPStretchesOutput(BaseModel):
    Stretch_ID: int
    id:int
    river_Code:int

class STPDrainOutput(BaseModel):
    Drain_No: int
    stretch_id:int
    id:int
    River_code:int

class STPDrainNewOutput(BaseModel):
    Drain_No: int
    stretch_id:int
    id:int
    River_code:int
    Name:str
class cachement_village(BaseModel):
    id:int
    village_name:str
    area:float

class STPCatchmentOutput(BaseModel):
    layer_name:str=None
    catchments:list=None



class STPStretchesInput(BaseModel):
    river_code: int=None
    all_data: bool = False

class STPDrainInput(BaseModel):
    stretch_ids: Annotated[List[int],None] = None
    all_data: bool = False

class STPCatchmentInput(BaseModel):
    drain_nos: Annotated[List[int],None] = None

class Town_request(BaseModel):
    subdis_code:Annotated[List[int],None] = None
    all_data : bool  = False

class Village_request(BaseModel):
    subdis_code:Annotated[List[int],None] = None
    all_data : bool  = False
    

#----------------------------------------------------------------------------------------
# stp report schema

class celery_id(BaseModel):
    task_id:str

class weight_insight(BaseModel):
        file_name: str
        weight: float

class CsvData(BaseModel):
        High: float
        Low: float
        Medium: float
        Very_High:float
        Very_Low: float
        Village_Name: str

class DataItem(BaseModel):
    file_name: str
    layer_name: str
class StpPriorityAdminReport(BaseModel):

    class LocationData(BaseModel):
        state:str
        districts:list
        subDistricts: list
    table:List[CsvData]
    place: str
    clip: List[int] = None
    raster: List[DataItem] = None
    location: LocationData
    weight_data: List[weight_insight]

class StpPriorityDrainReport(BaseModel):
    
    class LocationData(BaseModel):
        River:str
        Drain: list
        Stretch: list
        Catchment: list
    table:List[CsvData]
    place: str
    clip: List[int] = None
    raster: List[DataItem] = None
    location: LocationData
    weight_data: List[weight_insight]

class StpsuitabilityAdminReport(BaseModel):

    class LocationData(BaseModel):
        state:str
        districts:list
        subDistricts: list
        towns:list
        population:int
        
    table:List[CsvData]
    place: str
    clip: List[int] = None
    raster: List[DataItem] = None
    location: LocationData
    weight_data: List[weight_insight]
    non_weight_data: List[weight_insight]
    
class StpsuitabilityDrainReport(BaseModel):

    class LocationData(BaseModel):
        River:str
        Drain: list
        Stretch: list
        Catchment: list
    table:List[CsvData]
    place: str
    clip: List[int] = None
    raster: List[DataItem] = None
    location: LocationData
    weight_data: List[weight_insight]
    non_weight_data: List[weight_insight]


class Mardetails(BaseModel):
    lat:float
    lon:float

class RasterVisual(BaseModel):
    moduleName:str
    rasterName:str
    fileName:Optional[str]=None

class stp_area_resp(BaseModel):
    cluster_layer:str|None=None
    suitable_path:str|None=None

