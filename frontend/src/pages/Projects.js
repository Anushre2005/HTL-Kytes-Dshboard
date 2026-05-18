import React, { useState } from "react";
import { useData } from "../context/DataContext";
import FilterBar from "../components/FilterBar";
import { ProjectDetail } from "../components/Charts";
import { FEATURES, FEAT_KEYS, isUsed, adoptionColor } from "../utils/helpers";

export default function Projects() {
  const { getFilteredData } = useData();
  const [filters,  setFilters]  = useState({ pgh:"all", city:"all" });
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const d = getFilteredData(filters);

  const projects = (d.projects || []).filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Projects</h1>
          <p className="topbar-sub">Click any row to see feature-level breakdown</p>
        </div>
        <div className="topbar-right">
          <input className="select-input" placeholder="Search project…"
                 value={search} onChange={e=>setSearch(e.target.value)} style={{ width:180 }} />
          <FilterBar filters={filters} onChange={f=>{ setFilters(f); setSelected(null); }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 0.7fr", gap:16, alignItems:"start" }}>
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!d.projects ? <div className="spinner" /> : projects.length === 0 ? (
            <div className="empty-state"><p>No projects match your filters.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Project</th><th>Location</th><th>PGH</th><th>Adoption</th></tr></thead>
                <tbody>
                  {projects.map(p => {
                    const score = FEAT_KEYS.reduce((acc,k)=>acc+(isUsed(p[k])?1:0),0);
                    const pct   = Math.round(score/FEATURES.length*100);
                    const { text, bg } = adoptionColor(pct);
                    return (
                      <tr key={p.id} className={selected?.id===p.id?"selected":""} onClick={()=>setSelected(p)}>
                        <td><div style={{ fontWeight:500 }}>{p.title}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{p.id}</div></td>
                        <td style={{ color:"#6b7280", fontSize:12 }}>{p.city}</td>
                        <td><span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"#f3f4f6", color:"#6b7280" }}>{p.pgh}</span></td>
                        <td><span style={{ display:"inline-flex", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:bg, color:text }}>{score}/{FEATURES.length}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ProjectDetail project={selected} />
      </div>
    </>
  );
}
