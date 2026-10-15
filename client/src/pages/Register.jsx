import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8001";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
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
      const res = await axios.post(`${API}/api/user/register`, form);
      if (res.data.success) {
        setSuccess("Registration successful. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
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
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow p-4" style={{ width: "450px" }}>
        <h3 className="text-center mb-3">Register</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              name="fullName"
              className="form-control"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
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
          <div className="mb-3">
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
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
          {/* Role selection removed: public registration is for patients only. */}
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Submitting..." : "Register"}
          </button>
        </form>
        <p className="text-center mt-3 mb-0">
          Already have account? <Link to="/login">Login</Link>
        </p>
        <p className="text-center mt-1 mb-0">
          Are you a doctor? <Link to="/register/doctor">Doctor Sign Up</Link>
        </p>
      </div>
    </div>
  );
}