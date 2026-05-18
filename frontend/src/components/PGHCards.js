import React from "react";
import { PGH_COLORS } from "../utils/helpers";

export default function PGHCards({ pghData }) {
  if (!pghData || !pghData.length) return (
    <div className="pgh-cards-grid">
      {[1,2,3,4].map(i => (
        <div key={i} className="pgh-card">
          <div className="skel" style={{ height:12, width:50, marginBottom:8 }} />
          <div className="skel" style={{ height:32, width:70 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="pgh-cards-grid">
      {pghData.map(d => {
        const color = PGH_COLORS[d.pgh] || "#378ADD";
        return (
          <div key={d.pgh} className="pgh-card" style={{ borderTop:`3px solid ${color}` }}>
            <div className="pgh-card-label" style={{ color }}>{d.pgh}</div>
            <div className="pgh-card-value">{d.avg_adoption_pct}%</div>
            <div className="pgh-card-sub">
              {d.project_count} projects · avg {d.avg_features_used}/13 features
            </div>
          </div>
        );
      })}
    </div>
  );
}
