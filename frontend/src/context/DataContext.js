import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { FEAT_KEYS, FEATURES, isUsed, projectScore } from "../utils/helpers";

const DataContext = createContext(null);
const TOTAL = FEAT_KEYS.length;

export function DataProvider({ children }) {
  const [rawProjects, setRawProjects]   = useState(null);
  const [pghData,     setPghData]       = useState(null);
  const [filterOpts,  setFilterOpts]    = useState({ pghs:[], cities:[] });
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [error,       setError]         = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [projRes, pghRes, filtersRes, histRes] = await Promise.all([
        api.getProjects(),
        api.getPGH(),
        api.getFilters(),
        api.getUploadHistory(),
      ]);
      setRawProjects(projRes.data);
      setPghData(pghRes.data);
      setFilterOpts(filtersRes.data);
      setUploadHistory(histRes.data);
    } catch {
      setError("Failed to load dashboard data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshAfterUpload = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  const deleteUpload = useCallback(async (uploadId) => {
    await api.deleteUpload(uploadId);
    await fetchAll();
  }, [fetchAll]);

  // ── Pure in-memory filtering + recompute ────────────────────────────────
  const getFilteredData = useCallback((filters = {}) => {
    if (!rawProjects) return { projects: null, kpi: null, features: null, cities: null, pgh: pghData };

    const { pgh, city } = filters;
    const projects = rawProjects.filter(p => {
      if (pgh  && pgh  !== "all" && p.pgh  !== pgh)  return false;
      if (city && city !== "all" && p.city !== city) return false;
      return true;
    });

    const n = projects.length;
    if (n === 0) return { projects:[], kpi: emptyKPI(), features: emptyFeatures(), cities:[], pgh: pghData };

    // KPI
    const scores = projects.map(projectScore);
    const avg    = scores.reduce((a,b)=>a+b,0)/n;
    const hi     = scores.filter(s=>s>=10).length;
    const med    = scores.filter(s=>s>=5&&s<=9).length;
    const lo     = scores.filter(s=>s<=4).length;
    const kpi = {
      total_projects: n,
      avg_features_used: Math.round(avg*10)/10,
      high_adoption_count:   hi,   medium_adoption_count: med,   low_adoption_count: lo,
      high_adoption_pct: round1(hi/n*100), medium_adoption_pct: round1(med/n*100), low_adoption_pct: round1(lo/n*100),
    };

    // Features
    const features = FEATURES.map((name, i) => {
      const key  = FEAT_KEYS[i];
      const used = projects.filter(p => isUsed(p[key])).length;
      return { feature:name, used_count:used, total:n, percentage: round1(used/n*100) };
    });

    // Cities
    const cityMap = {};
    projects.forEach(p => { const c = p.city||"Unknown"; if(!cityMap[c]) cityMap[c]=[]; cityMap[c].push(p); });
    const cities = Object.entries(cityMap)
      .sort((a,b) => b[1].length - a[1].length)
      .map(([cityName, projs]) => {
        const cn = projs.length;
        const featCounts = FEAT_KEYS.map(k => projs.filter(p=>isUsed(p[k])).length);
        const totalScore = projs.reduce((acc,p)=>acc+projectScore(p),0);
        const avgPct = round1(totalScore/cn/TOTAL*100);
        const featBreakdown = FEATURES.map((name,i)=>({
          feature:name, used_count:featCounts[i], total:cn, percentage:round1(featCounts[i]/cn*100)
        }));
        const topFeature = featBreakdown.reduce((a,b)=>a.percentage>b.percentage?a:b).feature;
        const bestProj   = projs.reduce((a,b)=>projectScore(a)>=projectScore(b)?a:b);
        const bestScore  = projectScore(bestProj);
        return {
          city:cityName, project_count:cn, avg_adoption_pct:avgPct,
          top_feature:topFeature, feature_breakdown:featBreakdown,
          top_project_id:bestProj.id, top_project_title:bestProj.title,
          top_project_score:bestScore, top_project_pct:round1(bestScore/TOTAL*100),
        };
      });

    // PGH (only if no pgh filter applied — else use server pgh)
    const pghMap = {};
    projects.forEach(p => { if(!pghMap[p.pgh]) pghMap[p.pgh]=[]; pghMap[p.pgh].push(p); });
    const pgh2 = Object.entries(pghMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([name, projs])=>{
      const pn = projs.length;
      const avgS = projs.reduce((acc,p)=>acc+projectScore(p),0)/pn;
      return { pgh:name, project_count:pn, avg_adoption_pct:round1(avgS/TOTAL*100), avg_features_used:round1(avgS) };
    });

    return { projects, kpi, features, cities, pgh: pgh2 };
  }, [rawProjects, pghData]);

  return (
    <DataContext.Provider value={{
      rawProjects, pghData, filterOpts, uploadHistory,
      loading, error, refreshAfterUpload, getFilteredData, deleteUpload,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

function round1(n) { return Math.round(n*10)/10; }
function emptyKPI() {
  return { total_projects:0, avg_features_used:0, high_adoption_count:0, medium_adoption_count:0,
           low_adoption_count:0, high_adoption_pct:0, medium_adoption_pct:0, low_adoption_pct:0 };
}
function emptyFeatures() {
  return FEATURES.map(f=>({ feature:f, used_count:0, total:0, percentage:0 }));
}
