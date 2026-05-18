import pandas as pd
import re
from typing import List, Dict, Any
import io

CITY_MAP = {
    "Mumbai":       ["mumbai","bkc","andheri","chandivali","worli","juhu","bandra","goregaon","lower parel","dadar","malad","borivali"],
    "Thane":        ["thane"],
    "Pune":         ["pune","baner","bibwewadi","hinjewadi"],
    "Navi Mumbai":  ["navi mumbai","mahape","midc","airoli","vashi","nerul"],
    "Powai":        ["powai"],
    "Lucknow":      ["lucknow"],
    "Igatpuri":     ["igatpuri"],
    "Alibag":       ["alibag"],
    "Sambhaji Nagar": ["sambhaji nagar","aurangabad"],
}


def normalise_city(raw: str) -> str:
    if not raw:
        return "Unknown"
    r = str(raw).lower()
    for city, keywords in CITY_MAP.items():
        for kw in keywords:
            if kw in r:
                return city
    return str(raw).split(",")[0].strip().title()


def _parse_bool(val) -> bool:
    if val is None:
        return False
    s = str(val).strip().lower()
    return s in ("yes", "y", "true", "1", "completed", "done")


def _parse_int(val) -> int:
    if val is None or str(val).strip() in ("", "no", "NO", "-"):
        return 0
    nums = re.findall(r"\d+", str(val))
    return int(nums[0]) if nums else 0


def _parse_date(val) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    if s in ("", "0", "--", "nan", "None"):
        return ""
    # If it's a pandas Timestamp or datetime, format it
    try:
        import pandas as pd
        if hasattr(val, 'strftime'):
            return val.strftime("%d/%m/%Y")
    except Exception:
        pass
    return s


def parse_excel(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    xl = pd.ExcelFile(io.BytesIO(file_bytes))
    projects = []

    for sheet in xl.sheet_names:
        try:
            df = xl.parse(sheet, header=None)
        except Exception:
            continue

        header_row = None
        for i, row in df.iterrows():
            row_vals = [str(c).lower().strip() for c in row.values if c and str(c).strip()]
            if any("project id" in v for v in row_vals):
                header_row = i
                break
        if header_row is None:
            continue

        df.columns = [str(c).strip() for c in df.iloc[header_row].values]
        df = df.iloc[header_row + 1:].reset_index(drop=True)

        id_col = next((c for c in df.columns if "project id" in c.lower()), None)
        if not id_col:
            continue

        df = df.dropna(how="all")
        df = df[df[id_col].astype(str).str.match(r"DP\d+", na=False)]
        if df.empty:
            continue

        pgh_name = re.sub(r"\s+", "", sheet).upper()

        def col(name: str):
            for c in df.columns:
                if name.lower() in str(c).lower():
                    return c
            return None

        vpo_col = col("vendor po no") or col("vendor po") or col("po no")
        vwo_col = col("vendor wo")
        grn_col  = col("grn no") or col("grn")
        grn_date_col = col("grn last updated")
        dpr_col  = col("dpr no") or col("dpr")
        dpr_date_col = col("dpr last updated")

        for _, row in df.iterrows():
            proj_id = str(row.get(id_col, "")).strip()
            if not proj_id or not re.match(r"DP\d+", proj_id):
                continue
            raw_loc = str(row.get(col("site location") or col("location") or "", ""))
            try:
                projects.append({
                    "id": proj_id,
                    "title": str(row.get(col("project title") or "", "")).strip(),
                    "site_location": raw_loc.strip(),
                    "city": normalise_city(raw_loc),
                    "pgh": pgh_name,
                    "jts": _parse_bool(row.get(col("jts"))),
                    "boq": _parse_bool(row.get(col("boq"))),
                    "loi": _parse_bool(row.get(col("loi"))),
                    "customer_po": _parse_bool(row.get(col("customer po"))),
                    "project_schedule": str(row.get(col("project schedule") or "", "")).strip(),
                    "mrn_count":              _parse_int(row.get(col("mrn"))),
                    "vendor_po_count":        _parse_int(row.get(vpo_col) if vpo_col else None),
                    "vendor_wo_count":        _parse_int(row.get(vwo_col) if vwo_col else None),
                    "grn_count":              _parse_int(row.get(grn_col) if grn_col else None),
                    "grn_last_updated":       _parse_date(row.get(grn_date_col) if grn_date_col else None),
                    "dpr_count":              _parse_int(row.get(dpr_col) if dpr_col else None),
                    "dpr_last_updated":       _parse_date(row.get(dpr_date_col) if dpr_date_col else None),
                    "tds_count":              _parse_int(row.get(col("tds"))),
                    "drawing_count":          _parse_int(row.get(col("drawing"))),
                    "vendor_invoice_count":   _parse_int(row.get(col("vendor invoice"))),
                    "customer_invoice_count": _parse_int(row.get(col("customer invoice"))),
                    "milestone_status": str(row.get(col("milestone") or "", "")).strip(),
                    "upload_source": filename,
                })
            except Exception:
                continue

    return projects
