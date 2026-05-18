import axios from "axios";

const BASE = "/api";

export const api = {
  getProjects:      (params = {}) => axios.get(`${BASE}/projects`, { params }),
  getProject:       (id)          => axios.get(`${BASE}/projects/${id}`),
  getKPI:           (params = {}) => axios.get(`${BASE}/stats/kpi`, { params }),
  getFeatures:      (params = {}) => axios.get(`${BASE}/stats/features`, { params }),
  getPGH:           ()            => axios.get(`${BASE}/stats/pgh`),
  getCities:        (params = {}) => axios.get(`${BASE}/stats/cities`, { params, timeout: 30000 }),
  getFilters:       ()            => axios.get(`${BASE}/filters`),
  getUploadHistory: ()            => axios.get(`${BASE}/uploads`),
  deleteUpload: (id) => axios.delete(`${BASE}/uploads/${id}`),
  uploadExcel: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return axios.post(`${BASE}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => onProgress && onProgress(Math.round(e.loaded * 100 / e.total)),
    });
  },
};
