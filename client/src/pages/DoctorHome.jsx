import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8001";

export default function DoctorHome() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [user] = useState(() => {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw) : null;
  });
  const [tab, setTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    specialization: "",
    experience: "",
    fees: "",
    timings: "",
  });
  const [msg, setMsg] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API}/api/doctor/getdoctorappointments`, {
        headers,
      });
      if (res.data.success) setAppointments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    if (user.role !== "doctor") {
      navigate(user.role === "admin" ? "/adminhome" : "/userhome");
      return;
    }
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.post(
        `${API}/api/doctor/handlestatus`,
        { appointId: id, status },
        { headers }
      );
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (a) => {
    try {
      const res = await fetch(
        `${API}/api/doctor/getdocumentdownload?appointId=${a._id}`,
        { headers }
      );
      if (!res.ok) {
        alert("No document or failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = a.document?.filename || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        userId: user._id,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        specialization: profile.specialization,
        experience: profile.experience,
        fees: Number(profile.fees) || 0,
        timings: profile.timings
          ? profile.timings.split(",").map((t) => t.trim())
          : [],
      };
      const res = await axios.post(`${API}/api/doctor/updateprofile`, payload, {
        headers,
      });
      if (res.data.success) setMsg("Profile updated");
      else setMsg(res.data.message || "Update failed");
    } catch (err) {
      setMsg(err.response?.data?.message || "Update failed");
    }
  };

  const handleProfileChange = (e) =>
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="container-fluid">
      <div className="row min-vh-100">
        <aside className="col-md-3 col-lg-2 bg-dark text-white p-3">
          <h4 className="mb-4">Doctor Panel</h4>
          <button
            className={`btn btn-sm w-100 text-start mb-2 ${
              tab === "appointments" ? "btn-light" : "btn-outline-light"
            }`}
            onClick={() => setTab("appointments")}
          >
            Appointments
          </button>
          <button
            className={`btn btn-sm w-100 text-start mb-2 ${
              tab === "profile" ? "btn-light" : "btn-outline-light"
            }`}
            onClick={() => setTab("profile")}
          >
            Update Profile
          </button>
          <button
            className="btn btn-sm btn-outline-danger w-100 mt-3"
            onClick={logout}
          >
            Logout
          </button>
        </aside>

        <main className="col-md-9 col-lg-10 p-4">
          <h3 className="mb-4">Doctor Dashboard</h3>

          {tab === "appointments" && (
            <div>
              <h5>Assigned Appointments</h5>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No appointments
                        </td>
                      </tr>
                    )}
                    {appointments.map((a) => (
                      <tr key={a._id}>
                        <td>{a.userInfo?.fullName}</td>
                        <td>{a.date}</td>
                        <td>
                          <span className="badge bg-secondary">{a.status}</span>
                        </td>
                        <td>
                          {a.status === "pending" && (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleStatus(a._id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger me-2"
                                onClick={() => handleStatus(a._id, "rejected")}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {a.status === "approved" && (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleStatus(a._id, "completed")}
                            >
                              Complete
                            </button>
                          )}
                          {a.document && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleDownload(a)}
                            >
                              Download
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="card shadow p-4" style={{ maxWidth: "700px" }}>
              <h5 className="mb-3">Update Doctor Profile</h5>
              {msg && <div className="alert alert-info">{msg}</div>}
              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      name="fullName"
                      className="form-control"
                      value={profile.fullName}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      name="phone"
                      className="form-control"
                      value={profile.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={profile.email}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      className="form-control"
                      value={profile.address}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Specialization</label>
                    <input
                      name="specialization"
                      className="form-control"
                      value={profile.specialization}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Experience</label>
                    <input
                      name="experience"
                      className="form-control"
                      value={profile.experience}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Fees</label>
                    <input
                      type="number"
                      name="fees"
                      className="form-control"
                      value={profile.fees}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Timings (comma separated)</label>
                    <input
                      name="timings"
                      className="form-control"
                      value={profile.timings}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                <button className="btn btn-primary mt-3">Update</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}