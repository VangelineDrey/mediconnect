import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8001";

export default function DoctorRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    specialization: "",
    experience: "",
    fees: "",
    startTime: "",
    endTime: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${API}/api/user/registerdoctor`, {
        ...form,
        fees: Number(form.fees),
        timings: [form.startTime, form.endTime],
      });
      if (res.data.success) {
        setSuccess(
          "Registration submitted. Your account will be activated after admin verification. Redirecting to login..."
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow p-4" style={{ width: "600px" }}>
        <h3 className="text-center mb-3">Create Doctor Account</h3>
        <p className="text-center text-muted small">
          Register as a doctor. An admin will verify your details before your
          account is activated.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <h6 className="text-primary">Personal Details</h6>
          <div className="row g-3 mb-2">
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
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={form.password}
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
            <div className="col-12">
              <label className="form-label">Address</label>
              <input
                name="address"
                className="form-control"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <h6 className="text-primary mt-3">Professional Details</h6>
          <div className="row g-3">
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
          <button className="btn btn-primary w-100 mt-3" disabled={loading}>
            {loading ? "Submitting..." : "Register as Doctor"}
          </button>
        </form>
        <p className="text-center mt-3 mb-0">
          Register as a patient instead? <Link to="/register">Patient Sign Up</Link>
        </p>
      </div>
    </div>
  );
}