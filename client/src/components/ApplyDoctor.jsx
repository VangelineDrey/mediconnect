import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8001";

export default function ApplyDoctor({ userId, token, onApplied }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    specialization: "",
    experience: "",
    fees: "",
    startTime: "",
    endTime: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const payload = {
        userId,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        specialization: form.specialization,
        experience: form.experience,
        fees: Number(form.fees),
        timings: [form.startTime, form.endTime],
      };
      const res = await axios.post(`${API}/api/user/registerdoc`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMsg("Application submitted. Awaiting admin approval.");
        if (onApplied) onApplied();
      } else {
        setMsg(res.data.message || "Submission failed");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow p-4">
      <h4 className="mb-3">Apply as Doctor</h4>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Full Name</label>
            <input
              name="fullName"
              className="form-control"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Address</label>
            <input
              name="address"
              className="form-control"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Specialization</label>
            <input
              name="specialization"
              className="form-control"
              value={form.specialization}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Experience</label>
            <input
              name="experience"
              className="form-control"
              value={form.experience}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Fees</label>
            <input
              type="number"
              name="fees"
              className="form-control"
              value={form.fees}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              name="startTime"
              className="form-control"
              value={form.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">End Time</label>
            <input
              type="time"
              name="endTime"
              className="form-control"
              value={form.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <button className="btn btn-primary mt-3" disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}