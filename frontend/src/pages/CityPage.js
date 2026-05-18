import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import FilterBar from "../components/FilterBar";
import { CityPieCard } from "../components/Charts";
import { CITY_COLORS, adoptionColor } from "../utils/helpers";

export default function CityPage() {
  const { getFilteredData } = useData();
  const [filters, setFilters] = useState({ pgh:"all", city:"all" });
  const [visibleCities, setVisibleCities] = useState(new Set());
  const d = getFilteredData(filters);
  const cities = d.cities || [];

  // Render first 3 immediately, rest lazily on scroll
  useEffect(() => {
    if (!cities.length) return;
    setVisibleCities(new Set(cities.slice(0,3).map(c=>c.city)));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setVisibleCities(prev => new Set([...prev, e.target.dataset.city]));
      });
    }, { threshold:0.1 });
    const timeout = setTimeout(() => {
      document.querySelectorAll(".city-pie-sentinel").forEach(el => observer.observe(el));
    }, 100);
    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, [cities.length]);

  const Skel = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {[85,70,60,50,40].map((w,i)=>(<div key={i} className="skel" style={{ height:22, width:`${w}%`, borderRadius:6 }} />))}
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>City-wise adoption</h1>
          <p className="topbar-sub">Feature adoption rates broken down by project location</p>
        </div>
        <div className="topbar-right">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom:16 }}>
        {/* Adoption rate bars */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Adoption rate by city
          </div>
          {!cities.length ? <Skel /> : cities.map((c,i) => (
            <div key={c.city} className="bar-row">
              <span className="bar-label" title={c.city}>{c.city}</span>
              <div className="bar-wrap">
                <div className="bar-fill" style={{ width:`${c.avg_adoption_pct}%`, background:CITY_COLORS[i%CITY_COLORS.length] }}>
                  {c.project_count}p
                </div>
              </div>
              <span className="bar-pct">{c.avg_adoption_pct}%</span>
            </div>
          ))}
        </div>

        {/* Top feature per city */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Top adopted feature by city
          </div>
          {!cities.length ? <Skel /> : cities.map(c => (
            <div key={c.city} className="feat-row">
              <span style={{ color:"#111827" }}>{c.city}</span>
              <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:"#eff6ff", color:"#1d4ed8", fontWeight:500 }}>{c.top_feature}</span>
            </div>
          ))}
        </div>

        {/* Highest adoption project per city */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            Highest adoption project by city
          </div>
          {!cities.length ? <Skel /> : cities.map(c => {
            const { text, bg } = adoptionColor(c.top_project_pct);
            return (
              <div key={c.city} className="feat-row">
                <div>
                  <div style={{ color:"#111827", fontSize:13 }}>{c.city}</div>
                  <div style={{ color:"#9ca3af", fontSize:11, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={c.top_project_title}>
                    {c.top_project_title}
                  </div>
                </div>
                <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:bg, color:text, fontWeight:600, flexShrink:0 }}>
                  {c.top_project_score}/13
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:12 }}>
        Feature adoption breakdown by city
      </div>
      <div className="city-pies-grid">
        {cities.map(c => (
          <div key={c.city} data-city={c.city} className="city-pie-sentinel">
            {visibleCities.has(c.city) ? <CityPieCard cityData={c} /> : (
              <div className="city-pie-card" style={{ height:240, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#374151" }}>{c.city}</div>
                <div className="spinner" style={{ width:20, height:20, borderWidth:2, margin:0 }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
