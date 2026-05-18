import React from "react";
import { useData } from "../context/DataContext";

export default function FilterBar({ filters, onChange }) {
  const { filterOpts } = useData();

  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
      <select className="select-input" value={filters.pgh||"all"}
              onChange={e => onChange({ ...filters, pgh:e.target.value })}>
        <option value="all">All PGH groups</option>
        {(filterOpts.pghs||[]).map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select className="select-input" value={filters.city||"all"}
              onChange={e => onChange({ ...filters, city:e.target.value })}>
        <option value="all">All cities</option>
        {(filterOpts.cities||[]).map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {(filters.pgh !== "all" || filters.city !== "all") && (
        <button className="btn btn-outline" style={{ fontSize:12, padding:"6px 12px" }}
                onClick={() => onChange({ pgh:"all", city:"all" })}>
          Clear filters
        </button>
      )}
    </div>
  );
}
