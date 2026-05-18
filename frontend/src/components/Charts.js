// ── FeatureDonut ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import { Chart, ArcElement, DoughnutController, Tooltip } from "chart.js";
import { FEAT_COLORS, FEATURES, FEAT_KEYS, isUsed } from "../utils/helpers";

Chart.register(ArcElement, DoughnutController, Tooltip);

export function FeatureDonut({ features }) {
  const ref = useRef(null);
  const chart = useRef(null);

  useEffect(() => {
    if (!features?.length || !ref.current) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: features.map(f => f.feature),
        datasets: [{ data: features.map(f => f.used_count), backgroundColor: FEAT_COLORS, borderWidth:1, borderColor:"#fff" }],
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:"62%",
        plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw} projects (${features[ctx.dataIndex].percentage}%)`}} },
      },
    });
    return () => chart.current?.destroy();
  }, [features]);

  if (!features) return <div className="spinner" />;

  return (
    <div className="card" style={{ height:"100%" }}>
      <div className="card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        Overall feature usage
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"5px 10px", marginBottom:10, fontSize:11 }}>
        {features.map((f,i) => (
          <span key={f.feature} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:9, height:9, borderRadius:2, background:FEAT_COLORS[i], flexShrink:0 }} />
            <span style={{ color:"#374151" }}>{f.feature}</span>
            <span style={{ color:"#9ca3af" }}>{f.percentage}%</span>
          </span>
        ))}
      </div>
      <div style={{ position:"relative", height:190 }}>
        <canvas ref={ref} aria-label="Feature adoption donut" role="img" />
      </div>
    </div>
  );
}

// ── FeatureOverviewTable ──────────────────────────────────────────────────────
export function FeatureOverviewTable({ features }) {
  if (!features) return <div className="spinner" />;
  return (
    <div className="card" style={{ marginBottom:16 }}>
      <div className="card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Features at a glance — adoption rate across all projects
      </div>
      {features.map(f => {
        const p = f.percentage;
        const barColor = p>=70?"#16a34a":p>=40?"#d97706":"#dc2626";
        const cls = p>=70?"badge-high":p>=40?"badge-mid":"badge-low";
        return (
          <div key={f.feature} className="feat-row">
            <span style={{ color:"#111827" }}>{f.feature}</span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:140, background:"#f3f4f6", borderRadius:4, height:6, overflow:"hidden" }}>
                <div style={{ width:`${p}%`, height:"100%", background:barColor, borderRadius:4 }} />
              </div>
              <span style={{ fontSize:12, color:"#6b7280", width:36 }}>{p}%</span>
              <span className={`badge ${cls}`}>{p>=70?"High":p>=40?"Mid":"Low"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CityPieCard ───────────────────────────────────────────────────────────────
export function CityPieCard({ cityData }) {
  const ref  = useRef(null);
  const chart = useRef(null);

  useEffect(() => {
    if (!cityData || !ref.current) return;
    chart.current?.destroy();
    const adopted    = cityData.feature_breakdown.filter(f => f.used_count > 0);
    const notAdopted = cityData.feature_breakdown.filter(f => f.used_count === 0).length;
    chart.current = new Chart(ref.current, {
      type:"doughnut",
      data:{
        labels:[...adopted.map(f=>f.feature),...(notAdopted>0?["Not adopted"]:[])],
        datasets:[{
          data:[...adopted.map(f=>f.used_count),...(notAdopted>0?[notAdopted]:[])],
          backgroundColor:[...adopted.map(f=>FEAT_COLORS[cityData.feature_breakdown.findIndex(x=>x.feature===f.feature)]),...(notAdopted>0?["#f3f4f6"]:[])],
          borderWidth:1, borderColor:"#fff",
        }],
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:"55%",
                plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw} projects`}} } },
    });
    return () => chart.current?.destroy();
  }, [cityData]);

  if (!cityData) return null;
  const top4 = [...cityData.feature_breakdown].filter(f=>f.used_count>0).sort((a,b)=>b.used_count-a.used_count).slice(0,4);

  return (
    <div className="city-pie-card">
      <h4>{cityData.city}</h4>
      <p>{cityData.project_count} project{cityData.project_count>1?"s":""} · avg {cityData.avg_adoption_pct}% adoption</p>
      <div style={{ position:"relative", height:150 }}>
        <canvas ref={ref} aria-label={`Feature adoption for ${cityData.city}`} role="img" />
      </div>
      <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:5 }}>
        {top4.map(f => {
          const idx = cityData.feature_breakdown.findIndex(x=>x.feature===f.feature);
          return (
            <span key={f.feature} style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:"#6b7280" }}>
              <span style={{ width:8, height:8, borderRadius:2, background:FEAT_COLORS[idx], flexShrink:0 }} />
              {f.feature}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── ProjectDetail ─────────────────────────────────────────────────────────────
const NUM_FEATS  = [
  "mrn_count","vendor_po_count","vendor_wo_count",
  "grn_count","dpr_count",
  "tds_count","drawing_count",
  "vendor_invoice_count","customer_invoice_count"
];
const NUM_LABELS = [
  "MRN","Vendor PO","Vendor WO",
  "GRN","DPR",
  "TDS Tracker","Drawing Tracker",
  "Vendor Invoice","Customer Invoice"
];

export function ProjectDetail({ project }) {
  const ref  = useRef(null);
  const chart = useRef(null);

  useEffect(() => {
    if (!project || !ref.current) return;
    chart.current?.destroy();
    const adopted    = FEATURES.filter((_,i) => isUsed(project[FEAT_KEYS[i]]));
    const notAdopted = FEATURES.filter((_,i) => !isUsed(project[FEAT_KEYS[i]])).length;
    chart.current = new Chart(ref.current, {
      type:"doughnut",
      data:{
        labels:[...adopted, "Not adopted"],
        datasets:[{
          data:[...adopted.map(()=>1), notAdopted],
          backgroundColor:[...adopted.map((_,i)=>FEAT_COLORS[FEATURES.indexOf(adopted[i])]), "#f3f4f6"],
          borderWidth:1, borderColor:"#fff",
        }],
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:"58%",
                plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>ctx.label}} } },
    });
    return () => chart.current?.destroy();
  }, [project]);

  if (!project) return (
    <div className="card empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
      <p>Click a project row to see its feature breakdown</p>
    </div>
  );

  const score   = FEAT_KEYS.reduce((acc,k)=>acc+(isUsed(project[k])?1:0),0);
  const pct     = Math.round(score/FEATURES.length*100);
  const notUsed = FEATURES.filter((_,i)=>!isUsed(project[FEAT_KEYS[i]]));

  return (
    <div className="card">
      <div style={{ marginBottom:12 }}>
        <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>{project.title}</div>
        <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{project.id} · {project.city} · {project.pgh}</div>
      </div>
      <div style={{ background:"#f9fafb", borderRadius:8, padding:"10px 14px", textAlign:"center", marginBottom:12 }}>
        <div style={{ fontSize:24, fontWeight:600 }}>{score}<span style={{ fontSize:13, color:"#9ca3af" }}>/{FEATURES.length}</span></div>
        <div style={{ fontSize:11, color:"#6b7280" }}>features adopted ({pct}%)</div>
      </div>
      <div style={{ position:"relative", height:160, marginBottom:14 }}>
        <canvas ref={ref} aria-label={`Feature adoption for ${project.title}`} role="img" />
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>Numerical activity</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
        {NUM_FEATS.map((k,i) => (
          <div key={k} className={`mini-card ${project[k]>0?"used":"unused"}`}>
            <div className="mini-card-label">{NUM_LABELS[i]}</div>
            <div className="mini-card-value">{project[k]??0}</div>
          </div>
        ))}
      </div>
      {(project.grn_last_updated || project.dpr_last_updated) && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", 
                        textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>
            Last updated dates
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
            {project.grn_last_updated && (
              <div className="mini-card used">
                <div className="mini-card-label">GRN last updated</div>
                <div className="mini-card-value" style={{ fontSize:12 }}>
                  {project.grn_last_updated}
                </div>
              </div>
            )}
            {project.dpr_last_updated && (
              <div className="mini-card used">
                <div className="mini-card-label">DPR last updated</div>
                <div className="mini-card-value" style={{ fontSize:12 }}>
                  {project.dpr_last_updated}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {notUsed.length>0 && <>
        <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", marginBottom:6 }}>Not adopted ({notUsed.length})</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {notUsed.map(f=><span key={f} style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:"#fee2e2", color:"#991b1b" }}>{f}</span>)}
        </div>
      </>}
    </div>
  );
}
