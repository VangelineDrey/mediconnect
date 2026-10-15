import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8001";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/user/login`, form);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userData", JSON.stringify(res.data.data));
        const u = res.data.data;
        if (u.role === "admin") navigate("/adminhome");
        else if (u.role === "doctor") navigate("/doctorhome");
        else navigate("/userhome");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-3">Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
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
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center mt-3 mb-1">
          No account? <Link to="/register">Patient Sign Up</Link>
        </p>
        <p className="text-center mt-0 mb-0">
          Are you a doctor? <Link to="/register/doctor">Doctor Sign Up</Link>
        </p>
      </div>
    </div>
  );
}