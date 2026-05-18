import React, { useEffect, useRef, useState } from "react";
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { useData } from "../context/DataContext";
import FilterBar from "../components/FilterBar";
import { FEATURES, FEAT_KEYS, isUsed } from "../utils/helpers";

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip);

export default function FeaturesPage() {
  const { getFilteredData } = useData();
  const [filters,         setFilters]         = useState({ pgh:"all", city:"all" });
  const [selectedProject, setSelectedProject] = useState("all");
  const ref   = useRef(null);
  const chart = useRef(null);

  const d        = getFilteredData(filters);
  const projects = d.projects || [];

  // Compute display features — either global or single-project
  const displayFeatures = selectedProject !== "all"
    ? (() => {
        const proj = projects.find(p => p.id === selectedProject);
        if (!proj) return d.features;
        return FEATURES.map((name, i) => {
          const used = isUsed(proj[FEAT_KEYS[i]]);
          return { feature:name, used_count:used?1:0, total:1, percentage:used?100:0 };
        });
      })()
    : d.features;

  // Build chart
  useEffect(() => {
    if (!displayFeatures?.length || !ref.current) return;
    chart.current?.destroy();
    const colors = displayFeatures.map(f => f.percentage>=70?"#16a34a":f.percentage>=40?"#d97706":"#dc2626");
    chart.current = new Chart(ref.current, {
      type:"bar",
      data:{
        labels: displayFeatures.map(f=>f.feature),
        datasets:[{ data:displayFeatures.map(f=>f.percentage), backgroundColor:colors, borderWidth:0, borderRadius:3 }],
      },
      options:{
        indexAxis:"y", responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>`${ctx.raw}% (${displayFeatures[ctx.dataIndex].used_count} of ${displayFeatures[ctx.dataIndex].total})`}} },
        scales:{
          x:{ max:100, ticks:{callback:v=>v+"%",font:{size:11}}, grid:{color:"#f3f4f6"} },
          y:{ ticks:{font:{size:12}}, grid:{display:false} },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [displayFeatures]);

  const lowFeatures = (displayFeatures||[]).filter(f=>f.percentage<40).sort((a,b)=>a.percentage-b.percentage);
  const selectedProj = projects.find(p=>p.id===selectedProject);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Feature adoption</h1>
          <p className="topbar-sub">Which Kytes features are being used — and which need attention</p>
        </div>
        <div className="topbar-right">
          <select className="select-input" value={selectedProject}
                  onChange={e=>setSelectedProject(e.target.value)} style={{ minWidth:200 }}>
            <option value="all">All projects</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.title} ({p.id})</option>)}
          </select>
          <FilterBar filters={filters} onChange={f=>{ setFilters(f); setSelectedProject("all"); }} />
        </div>
      </div>

      {selectedProject !== "all" && selectedProj && (
        <div className="alert alert-info" style={{ marginBottom:16 }}>
          Showing feature adoption for: <strong>{selectedProj.title}</strong>
          <button onClick={()=>setSelectedProject("all")}
                  style={{ marginLeft:12, fontSize:12, cursor:"pointer", background:"none",
                           border:"none", color:"#1d4ed8", textDecoration:"underline" }}>
            Clear
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Feature adoption % {selectedProject!=="all" ? `— ${selectedProj?.title||""}` : "across all projects"}
        </div>
        <div style={{ display:"flex", gap:16, marginBottom:14 }}>
          {[["#16a34a","High (70%+)"],["#d97706","Mid (40–69%)"],["#dc2626","Low (<40%)"]].map(([c,l])=>(
            <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#6b7280" }}>
              <span style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
            </span>
          ))}
        </div>
        <div style={{ position:"relative", height:360 }}>
          <canvas ref={ref} aria-label="Feature adoption horizontal bar chart" role="img" />
        </div>
      </div>

      {lowFeatures.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ color:"#991b1b" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color:"#dc2626" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Features needing attention — below 40% adoption
          </div>
          {lowFeatures.map(f=>(
            <div key={f.feature} className="feat-row">
              <span style={{ color:"#111827" }}>{f.feature}</span>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:140, background:"#f3f4f6", borderRadius:4, height:6, overflow:"hidden" }}>
                  <div style={{ width:`${f.percentage}%`, height:"100%", background:"#dc2626", borderRadius:4 }} />
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:"#dc2626", width:36 }}>{f.percentage}%</span>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{f.used_count}/{f.total} projects</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
