import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DoctorList from "./DoctorList.jsx";

const API = "http://localhost:8001";

export default function DoctorBrowser({ userdata, token, onBooked }) {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [maxFee, setMaxFee] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce so we are not firing a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (specialization !== "all") params.specialization = specialization;
        if (maxFee) params.maxFee = maxFee;
        if (sort) params.sort = sort;

        const res = await axios.get(`${API}/api/user/getalldoctorsu`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        if (res.data.success) {
          setDoctors(res.data.data || []);
          if (res.data.specializations) {
            setSpecializations(res.data.specializations);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load doctors");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [search, specialization, maxFee, sort, token]);

  const hasFilters = search.trim() || specialization !== "all" || maxFee;

  const clearFilters = () => {
    setSearch("");
    setSpecialization("all");
    setMaxFee("");
  };

  const resultLabel = useMemo(() => {
    if (loading) return "Searching…";
    if (doctors.length === 0) return "No doctors match your filters";
    return `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available`;
  }, [doctors.length, loading]);

  return (
    <div>
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label" htmlFor="doc-search">
                Search
              </label>
              <input
                id="doc-search"
                type="search"
                className="form-control"
                placeholder="Name, specialty or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" htmlFor="doc-spec">
                Specialty
              </label>
              <select
                id="doc-spec"
                className="form-select"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="all">All specialties</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label" htmlFor="doc-fee">
                Max fee
              </label>
              <input
                id="doc-fee"
                type="number"
                min="0"
                className="form-control"
                placeholder="Any"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label" htmlFor="doc-sort">
                Sort
              </label>
              <select
                id="doc-sort"
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="name">Name (A–Z)</option>
                <option value="fee_asc">Fee: low to high</option>
                <option value="fee_desc">Fee: high to low</option>
              </select>
            </div>

            <div className="col-md-1 d-grid">
              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
                disabled={!hasFilters}
                title="Clear filters"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <p className="text-muted mb-0">{resultLabel}</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {!loading && doctors.length === 0 && (
        <div className="alert alert-light border text-center">
          No approved doctors found.
          {hasFilters && (
            <>
              {" "}
              <button className="btn btn-link p-0" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {doctors.map((d) => (
        <DoctorList
          key={d._id}
          doctor={d}
          userdata={userdata}
          token={token}
          onBooked={onBooked}
        />
      ))}
    </div>
  );
}