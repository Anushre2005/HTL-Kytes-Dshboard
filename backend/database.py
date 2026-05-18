from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./kytes.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"
    id             = Column(String, primary_key=True, index=True)
    title          = Column(String, nullable=False)
    site_location  = Column(String)
    city           = Column(String)
    pgh            = Column(String)
    jts            = Column(Boolean, default=False)
    boq            = Column(Boolean, default=False)
    loi            = Column(Boolean, default=False)
    customer_po    = Column(Boolean, default=False)
    project_schedule       = Column(String)
    mrn_count              = Column(Integer, default=0)
    vendor_po_count        = Column(Integer, default=0)
    vendor_wo_count        = Column(Integer, default=0)
    grn_count              = Column(Integer, default=0)
    grn_last_updated       = Column(String)
    dpr_count              = Column(Integer, default=0)
    dpr_last_updated       = Column(String)
    tds_count              = Column(Integer, default=0)
    drawing_count          = Column(Integer, default=0)
    vendor_invoice_count   = Column(Integer, default=0)
    customer_invoice_count = Column(Integer, default=0)
    milestone_status = Column(String)
    last_updated     = Column(DateTime, default=datetime.utcnow)
    upload_source    = Column(String)


class UploadLog(Base):
    __tablename__ = "upload_logs"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    filename      = Column(String)
    uploaded_at   = Column(DateTime, default=datetime.utcnow)
    rows_inserted = Column(Integer, default=0)
    rows_updated  = Column(Integer, default=0)
    notes         = Column(Text)


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    username        = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_upload_admin = Column(Boolean, default=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
