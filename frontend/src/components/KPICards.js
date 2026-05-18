import React from "react";

export default function KPICards({ kpi }) {
  if (!kpi) return (
    <div className="kpi-grid">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="kpi-card">
          <div className="skel" style={{ height:11, width:80, marginBottom:8 }} />
          <div className="skel" style={{ height:28, width:60 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Total projects</div>
        <div className="kpi-value">{kpi.total_projects}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Avg features used</div>
        <div className="kpi-value">{kpi.avg_features_used}<span style={{ fontSize:14, color:"#9ca3af" }}>/13</span></div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">High adoption (10+ features)</div>
        <div className="kpi-value" style={{ color:"#166534" }}>{kpi.high_adoption_count}</div>
        <div className="kpi-sub">{kpi.high_adoption_pct}% of projects</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Medium adoption (5–9 features)</div>
        <div className="kpi-value" style={{ color:"#92400e" }}>{kpi.medium_adoption_count}</div>
        <div className="kpi-sub">{kpi.medium_adoption_pct}% of projects</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Low adoption (≤4 features)</div>
        <div className="kpi-value" style={{ color:"#991b1b" }}>{kpi.low_adoption_count}</div>
        <div className="kpi-sub">{kpi.low_adoption_pct}% of projects</div>
      </div>
    </div>
  );
}
