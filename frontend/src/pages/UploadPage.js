import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "../utils/api";
import { useData } from "../context/DataContext";
import { fmtDate } from "../utils/helpers";

export default function UploadPage() {
  const { uploadHistory, refreshAfterUpload, deleteUpload } = useData();
  const [status,    setStatus]    = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const onDrop = useCallback(async (accepted, rejected) => {
    const file = accepted[0] || rejected[0]?.file;
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","xlsm"].includes(ext)) {
      setStatus({ type:"error", message:"Please upload an Excel file (.xlsx or .xls)." });
      return;
    }
    setUploading(true); setStatus(null); setProgress(0);
    try {
      const res = await api.uploadExcel(file, setProgress);
      setStatus({ type:"success", message: res.data.message + ` Total in DB: ${res.data.total_projects} projects.` });
      await refreshAfterUpload();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setStatus({ type:"error", message: typeof detail==="string" ? detail : "Upload failed. Check the backend terminal for details." });
    } finally {
      setUploading(false); setProgress(0);
    }
  }, [refreshAfterUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:{
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"],
      "application/vnd.ms-excel":[".xls"],
      "application/octet-stream":[".xlsx",".xls",".xlsm"],
      "application/zip":[".xlsx"],
    },
    maxFiles:1,
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Upload &amp; append data</h1>
          <p className="topbar-sub">New uploads are merged into existing data — no data is lost</p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom:20 }}>
        <strong>How appending works:</strong> Existing Project IDs are <em>updated</em>. New Project IDs are <em>inserted</em>. Historical data is always preserved. The entire dashboard refreshes automatically after upload.
      </div>

      <div {...getRootProps()} className={`dropzone${isDragActive?" active":""}`} style={{ marginBottom:20 }}>
        <input {...getInputProps()} />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {isDragActive
          ? <h3>Drop the Excel file here</h3>
          : <><h3>Drag &amp; drop a Kytes adoption Excel file</h3><p>or click to browse — .xlsx and .xls supported</p></>
        }
      </div>

      {uploading && (
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, color:"#374151", marginBottom:8 }}>Uploading and processing…</div>
          <div style={{ background:"#f3f4f6", borderRadius:4, height:8, overflow:"hidden" }}>
            <div style={{ width:`${progress}%`, height:"100%", background:"#378ADD", borderRadius:4, transition:"width .2s" }} />
          </div>
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>{progress}%</div>
        </div>
      )}

      {status && <div className={`alert alert-${status.type}`} style={{ marginBottom:20 }}>{status.message}</div>}

      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Upload history
        </div>
        {!uploadHistory?.length ? (
          <div className="empty-state" style={{ padding:"24px 0" }}><p>No uploads yet</p></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Filename</th><th>Uploaded at</th><th>Inserted</th><th>Updated</th><th>Notes</th><th>Action</th></tr></thead>
              <tbody>
                {uploadHistory.map(h=>(
                  <tr key={h.id}>
                    <td style={{ fontWeight:500 }}>{h.filename}</td>
                    <td style={{ color:"#6b7280", fontSize:12 }}>{fmtDate(h.uploaded_at)}</td>
                    <td><span style={{ color:"#166534", fontWeight:600 }}>+{h.rows_inserted}</span></td>
                    <td><span style={{ color:"#92400e", fontWeight:600 }}>~{h.rows_updated}</span></td>
                    <td style={{ color:"#9ca3af", fontSize:12 }}>{h.notes}</td>
                    <td>
                      <button
                        onClick={() => setConfirmDelete(h)}
                        style={{
                          background: "none", border: "1px solid #fecaca",
                          borderRadius: 6, padding: "4px 10px", fontSize: 11,
                          color: "#dc2626", cursor: "pointer", fontWeight: 500,
                          display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "32px 36px",
            width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, background: "#fee2e2", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="#dc2626" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 
                           1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                Delete this upload?
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                This will permanently delete <strong>{confirmDelete.filename}</strong> and 
                all <strong>{confirmDelete.rows_inserted + confirmDelete.rows_updated} projects</strong> 
                associated with it from the dashboard.
                <br /><br />
                <span style={{ color: "#dc2626", fontWeight: 500 }}>
                  This action cannot be undone.
                </span>
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-outline"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff" }}
                onClick={async () => {
                  try {
                    await deleteUpload(confirmDelete.id);
                    setStatus({
                      type: "success",
                      message: `"${confirmDelete.filename}" and its projects have been deleted.`
                    });
                  } catch (err) {
                    setStatus({
                      type: "error",
                      message: err.response?.data?.detail || "Delete failed."
                    });
                  } finally {
                    setConfirmDelete(null);
                  }
                }}
              >
                Yes, delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
