export const FEATURES = [
  "JTS", "BOQ", "LOI", "Customer PO",
  "MRN", "Vendor PO", "Vendor WO",
  "GRN", "DPR",
  "TDS Tracker", "Drawing Tracker", "Project Schedule",
  "Vendor Invoice", "Customer Invoice"
];

export const FEAT_KEYS = [
  "jts", "boq", "loi", "customer_po",
  "mrn_count", "vendor_po_count", "vendor_wo_count",
  "grn_count", "dpr_count",
  "tds_count", "drawing_count", "project_schedule",
  "vendor_invoice_count", "customer_invoice_count"
];

export const FEAT_COLORS = [
  "#4f86c6","#2ecc71","#e67e22","#9b59b6",
  "#1abc9c","#e74c3c","#2980b9",
  "#f39c12","#3498db",
  "#27ae60","#8e44ad","#16a085",
  "#d35400","#c0392b"
];
export const PGH_COLORS = { PGH1:"#378ADD", PGH2:"#1D9E75", PGH3:"#D85A30", PGH4:"#7F77DD" };
export const CITY_COLORS = ["#378ADD","#1D9E75","#D85A30","#7F77DD","#BA7517","#639922","#E24B4A","#185FA5","#0F6E56"];

export function isUsed(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number")  return val > 0;
  if (typeof val === "string")  return !["","no","not updated","0"].includes(val.toLowerCase().trim());
  return false;
}
export function projectScore(p) {
  return FEAT_KEYS.reduce((acc, k) => acc + (isUsed(p[k]) ? 1 : 0), 0);
}
export function adoptionColor(pct) {
  if (pct >= 70) return { text:"#166534", bg:"#dcfce7" };
  if (pct >= 40) return { text:"#92400e", bg:"#fef3c7" };
  return { text:"#991b1b", bg:"#fee2e2" };
}
export function adoptionLabel(pct) {
  if (pct >= 70) return "High";
  if (pct >= 40) return "Mid";
  return "Low";
}
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
