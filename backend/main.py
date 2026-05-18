from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from passlib.context import CryptContext
from jose import JWTError, jwt
import time
import os
import logging

from database import get_db, create_tables, SessionLocal, engine, Project, UploadLog, User
from schemas import (
    ProjectOut, UploadResult, KPISummary, FeatureAdoption,
    PGHAdoption, CityAdoption, UploadLogOut,
    CreateUserRequest, UserOut
)
from excel_parser import parse_excel

# ── Constants ────────────────────────────────────────────────────────────────
SECRET_KEY = "kytes-dashboard-secret-2024-change-in-production"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

FEAT_KEYS = [
    "jts", "boq", "loi", "customer_po",
    "mrn_count", "vendor_po_count", "vendor_wo_count",
    "grn_count", "dpr_count",
    "tds_count", "drawing_count", "project_schedule",
    "vendor_invoice_count", "customer_invoice_count"
]
FEAT_LABELS = [
    "JTS", "BOQ", "LOI", "Customer PO",
    "MRN", "Vendor PO", "Vendor WO",
    "GRN", "DPR",
    "TDS Tracker", "Drawing Tracker", "Project Schedule",
    "Vendor Invoice", "Customer Invoice"
]
TOTAL_FEATURES = len(FEAT_KEYS)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Kytes Adoption Dashboard API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ─────────────────────────────────────────────────────────────────────
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(password):        return pwd_context.hash(password)

def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 60  # seconds

def _cache_get(key):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None

def _cache_set(key, data):
    _cache[key] = {"data": data, "ts": time.time()}

def _cache_clear():
    _cache.clear()

# ── Helpers ───────────────────────────────────────────────────────────────────
def is_used(val) -> bool:
    if val is None: return False
    if isinstance(val, bool): return val
    if isinstance(val, int):  return val > 0
    if isinstance(val, str):  return val.strip().lower() not in ("","no","not updated","0")
    return False

def project_score(p: Project) -> int:
    return sum(1 for k in FEAT_KEYS if is_used(getattr(p, k, None)))

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    create_tables()
    
    # Auto-migrate: add new columns if they don't exist
    from sqlalchemy import text
    with engine.connect() as conn:
        existing = [row[1] for row in conn.execute(text("PRAGMA table_info(projects)"))]
        migrations = [
            ("vendor_wo_count",  "ALTER TABLE projects ADD COLUMN vendor_wo_count INTEGER DEFAULT 0"),
            ("grn_last_updated", "ALTER TABLE projects ADD COLUMN grn_last_updated TEXT"),
            ("dpr_last_updated", "ALTER TABLE projects ADD COLUMN dpr_last_updated TEXT"),
        ]
        for col_name, sql in migrations:
            if col_name not in existing:
                conn.execute(text(sql))
                print(f"[migration] Added column: {col_name}")
        conn.commit()

    db = SessionLocal()
    if not db.query(User).first():
        db.add(User(
            username="admin",
            hashed_password=hash_password("kytes@2024"),
            is_upload_admin=True
        ))
        db.commit()
    db.close()

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"access_token": create_token({"sub": user.username}), "token_type": "bearer"}

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "is_upload_admin": current_user.is_upload_admin}

@app.post("/api/auth/users", response_model=UserOut)
def create_user(payload: CreateUserRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=payload.username, hashed_password=hash_password(payload.password), is_upload_admin=True)
    db.add(user); db.commit(); db.refresh(user)
    return user

@app.get("/api/auth/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()

@app.delete("/api/auth/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()
    return {"message": f"User {username} deleted"}

# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/api/upload", response_model=UploadResult)
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("xlsx", "xls", "xlsm"):
        raise HTTPException(status_code=400, detail=f"Only Excel files accepted. Got: .{ext}")

    contents = await file.read()
    try:
        projects = parse_excel(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse Excel: {str(e)}")

    if not projects:
        raise HTTPException(status_code=422, detail="No valid project rows found. Check sheets are named 'PGH 1', 'PGH 2' etc.")

    inserted = updated = 0
    for p in projects:
        try:
            existing = db.query(Project).filter(Project.id == p["id"]).first()
            if existing:
                for k, v in p.items():
                    setattr(existing, k, v)
                existing.last_updated = datetime.utcnow()
                updated += 1
            else:
                db.add(Project(**p))
                inserted += 1
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"DB error on {p.get('id')}: {str(e)}")

    db.commit()
    db.add(UploadLog(filename=file.filename, rows_inserted=inserted, rows_updated=updated,
                     notes=f"Parsed {len(projects)} rows."))
    db.commit()
    _cache_clear()  # invalidate all cached data

    return UploadResult(
        filename=file.filename,
        rows_inserted=inserted,
        rows_updated=updated,
        total_projects=db.query(Project).count(),
        message=f"Upload successful. {inserted} new projects added, {updated} updated."
    )

# ── Projects ──────────────────────────────────────────────────────────────────
@app.get("/api/projects", response_model=List[ProjectOut])
def get_projects(
    pgh:  Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db:   Session = Depends(get_db)
):
    cached = _cache_get(f"projects_{pgh}_{city}")
    if cached: return cached
    q = db.query(Project)
    if pgh  and pgh  != "all": q = q.filter(Project.pgh == pgh)
    if city and city != "all": q = q.filter(Project.city == city)
    result = q.all()
    _cache_set(f"projects_{pgh}_{city}", result)
    return result

@app.get("/api/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(status_code=404, detail="Project not found")
    return p

# ── KPI ───────────────────────────────────────────────────────────────────────
@app.get("/api/stats/kpi", response_model=KPISummary)
def get_kpi(pgh: Optional[str] = Query(None), city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    cached = _cache_get(f"kpi_{pgh}_{city}")
    if cached: return cached
    q = db.query(Project)
    if pgh  and pgh  != "all": q = q.filter(Project.pgh == pgh)
    if city and city != "all": q = q.filter(Project.city == city)
    projects = q.all()
    n = len(projects)
    if n == 0:
        return KPISummary(total_projects=0, avg_features_used=0,
                          high_adoption_count=0, medium_adoption_count=0, low_adoption_count=0,
                          high_adoption_pct=0, medium_adoption_pct=0, low_adoption_pct=0)
    scores = [project_score(p) for p in projects]
    avg = round(sum(scores) / n, 1)
    hi  = sum(1 for s in scores if s >= 10)
    med = sum(1 for s in scores if 5 <= s <= 9)
    lo  = sum(1 for s in scores if s <= 4)
    result = KPISummary(
        total_projects=n, avg_features_used=avg,
        high_adoption_count=hi,   medium_adoption_count=med,   low_adoption_count=lo,
        high_adoption_pct=round(hi/n*100,1), medium_adoption_pct=round(med/n*100,1), low_adoption_pct=round(lo/n*100,1),
    )
    _cache_set(f"kpi_{pgh}_{city}", result)
    return result

# ── Features ──────────────────────────────────────────────────────────────────
@app.get("/api/stats/features", response_model=List[FeatureAdoption])
def get_features(pgh: Optional[str] = Query(None), city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    cached = _cache_get(f"features_{pgh}_{city}")
    if cached: return cached
    q = db.query(Project)
    if pgh  and pgh  != "all": q = q.filter(Project.pgh == pgh)
    if city and city != "all": q = q.filter(Project.city == city)
    projects = q.all()
    n = len(projects)
    result = [
        FeatureAdoption(feature=label, used_count=(used := sum(1 for p in projects if is_used(getattr(p, key, None)))),
                        total=n, percentage=round(used/n*100,1) if n else 0)
        for label, key in zip(FEAT_LABELS, FEAT_KEYS)
    ]
    _cache_set(f"features_{pgh}_{city}", result)
    return result

# ── PGH ───────────────────────────────────────────────────────────────────────
@app.get("/api/stats/pgh", response_model=List[PGHAdoption])
def get_pgh(db: Session = Depends(get_db)):
    cached = _cache_get("pgh")
    if cached: return cached
    projects = db.query(Project).all()
    groups = defaultdict(list)
    for p in projects: groups[p.pgh].append(p)
    result = []
    for pgh in sorted(groups):
        projs = groups[pgh]; n = len(projs)
        scores = [project_score(p) for p in projs]
        avg = sum(scores)/n
        result.append(PGHAdoption(pgh=pgh, project_count=n,
                                  avg_adoption_pct=round(avg/TOTAL_FEATURES*100,1),
                                  avg_features_used=round(avg,1)))
    _cache_set("pgh", result)
    return result

# ── Cities ────────────────────────────────────────────────────────────────────
@app.get("/api/stats/cities", response_model=List[CityAdoption])
def get_cities(pgh: Optional[str] = Query(None), db: Session = Depends(get_db)):
    cache_key = f"cities_{pgh or 'all'}"
    cached = _cache_get(cache_key)
    if cached: return cached

    q = db.query(Project)
    if pgh and pgh != "all": q = q.filter(Project.pgh == pgh)
    all_projects = q.all()
    if not all_projects: return []

    city_map = defaultdict(list)
    for p in all_projects:
        city_map[p.city or "Unknown"].append(p)

    result = []
    for city, projs in sorted(city_map.items(), key=lambda x: -len(x[1])):
        n = len(projs)
        feat_counts = [0] * TOTAL_FEATURES
        total_score = 0
        best_proj = None; best_score = -1

        for p in projs:
            score = 0
            for i, k in enumerate(FEAT_KEYS):
                if is_used(getattr(p, k, None)):
                    feat_counts[i] += 1
                    score += 1
            total_score += score
            if score > best_score:
                best_score = score; best_proj = p

        avg_pct = round(total_score / n / TOTAL_FEATURES * 100, 1)
        feat_breakdown = [
            FeatureAdoption(feature=FEAT_LABELS[i], used_count=feat_counts[i],
                            total=n, percentage=round(feat_counts[i]/n*100,1))
            for i in range(TOTAL_FEATURES)
        ]
        top_feature = max(feat_breakdown, key=lambda x: x.percentage).feature

        result.append(CityAdoption(
            city=city, project_count=n, avg_adoption_pct=avg_pct,
            top_feature=top_feature, feature_breakdown=feat_breakdown,
            top_project_id=best_proj.id if best_proj else "",
            top_project_title=best_proj.title if best_proj else "",
            top_project_score=best_score if best_score >= 0 else 0,
            top_project_pct=round(best_score/TOTAL_FEATURES*100,1) if best_score >= 0 else 0,
        ))

    _cache_set(cache_key, result)
    return result

# ── Filters ───────────────────────────────────────────────────────────────────
@app.get("/api/filters")
def get_filters(db: Session = Depends(get_db)):
    cached = _cache_get("filters")
    if cached: return cached
    pghs   = sorted([r[0] for r in db.query(Project.pgh).distinct().all()  if r[0]])
    cities = sorted([r[0] for r in db.query(Project.city).distinct().all() if r[0]])
    result = {"pghs": pghs, "cities": cities}
    _cache_set("filters", result)
    return result

# ── Upload history ────────────────────────────────────────────────────────────
@app.get("/api/uploads", response_model=List[UploadLogOut])
def get_uploads(db: Session = Depends(get_db)):
    return db.query(UploadLog).order_by(UploadLog.uploaded_at.desc()).limit(20).all()

@app.delete("/api/uploads/{upload_id}")
def delete_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the upload log
    log = db.query(UploadLog).filter(UploadLog.id == upload_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Delete all projects that came from this file
    deleted_projects = db.query(Project).filter(
        Project.upload_source == log.filename
    ).delete(synchronize_session=False)

    # Delete the upload log itself
    db.delete(log)
    db.commit()
    _cache_clear()

    return {
        "message": f"Upload '{log.filename}' and {deleted_projects} associated projects deleted successfully.",
        "deleted_projects": deleted_projects,
        "filename": log.filename
    }

# test2
