import React, { useState } from "react";
import { useData } from "../context/DataContext";
import FilterBar from "../components/FilterBar";
import PGHCards from "../components/PGHCards";
import KPICards from "../components/KPICards";
import { FeatureDonut, FeatureOverviewTable } from "../components/Charts";

export default function Overview() {
  const { getFilteredData } = useData();
  const [filters, setFilters] = useState({ pgh:"all", city:"all" });
  const d = getFilteredData(filters);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Overview</h1>
          <p className="topbar-sub">App adoption summary across all projects and PGH groups</p>
        </div>
        <div className="topbar-right">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      <PGHCards pghData={d.pgh} />
      <KPICards kpi={d.kpi} />

      <div className="grid-2">
        <div className="card" style={{ height:"100%" }}>
          {/* placeholder left card for future chart */}
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Adoption distribution
          </div>
          {d.kpi && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:4 }}>
              {[
                { label:"High adoption (10+ features)", count:d.kpi.high_adoption_count,   pct:d.kpi.high_adoption_pct,   color:"#16a34a" },
                { label:"Medium adoption (5–9 features)", count:d.kpi.medium_adoption_count, pct:d.kpi.medium_adoption_pct, color:"#d97706" },
                { label:"Low adoption (≤4 features)",   count:d.kpi.low_adoption_count,    pct:d.kpi.low_adoption_pct,    color:"#dc2626" },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span style={{ color:"#374151" }}>{item.label}</span>
                    <span style={{ color:"#6b7280" }}>{item.count} projects ({item.pct}%)</span>
                  </div>
                  <div style={{ background:"#f3f4f6", borderRadius:4, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${item.pct}%`, height:"100%", background:item.color, borderRadius:4, transition:"width .4s" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <FeatureDonut features={d.features} />
      </div>

      <FeatureOverviewTable features={d.features} />
    </>
  );
}
