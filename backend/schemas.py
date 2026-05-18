from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectOut(BaseModel):
    id: str
    title: str
    site_location: Optional[str] = None
    city: Optional[str] = None
    pgh: Optional[str] = None
    jts: bool = False
    boq: bool = False
    loi: bool = False
    customer_po: bool = False
    project_schedule: Optional[str] = None
    mrn_count: int = 0
    vendor_po_count: int = 0
    vendor_wo_count: int = 0
    grn_count: int = 0
    grn_last_updated: Optional[str] = None
    dpr_count: int = 0
    dpr_last_updated: Optional[str] = None
    tds_count: int = 0
    drawing_count: int = 0
    vendor_invoice_count: int = 0
    customer_invoice_count: int = 0
    milestone_status: Optional[str] = None
    last_updated: Optional[datetime] = None
    upload_source: Optional[str] = None
    class Config:
        from_attributes = True


class UploadResult(BaseModel):
    filename: str
    rows_inserted: int
    rows_updated: int
    total_projects: int
    message: str


class KPISummary(BaseModel):
    total_projects: int
    avg_features_used: float
    high_adoption_count: int
    medium_adoption_count: int
    low_adoption_count: int
    high_adoption_pct: float
    medium_adoption_pct: float
    low_adoption_pct: float


class FeatureAdoption(BaseModel):
    feature: str
    used_count: int
    total: int
    percentage: float


class PGHAdoption(BaseModel):
    pgh: str
    project_count: int
    avg_adoption_pct: float
    avg_features_used: float


class CityAdoption(BaseModel):
    city: str
    project_count: int
    avg_adoption_pct: float
    top_feature: str
    feature_breakdown: List[FeatureAdoption]
    top_project_id: str = ""
    top_project_title: str = ""
    top_project_score: int = 0
    top_project_pct: float = 0.0


class UploadLogOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    rows_inserted: int
    rows_updated: int
    notes: Optional[str] = None
    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    is_upload_admin: bool
    class Config:
        from_attributes = True
