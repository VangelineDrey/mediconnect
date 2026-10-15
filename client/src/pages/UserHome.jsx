import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DoctorBrowser from "../components/DoctorBrowser.jsx";
import ApplyDoctor from "../components/ApplyDoctor.jsx";
import NotificationPanel from "../components/Notification.jsx";
import AwaitingVerification from "../components/AwaitingVerification.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const API = "http://localhost:8001";

const APPT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

const isUpcoming = (a) => new Date(a.date.replace(" ", "T")) >= new Date();

export default function UserHome() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw) : null;
  });
  const [appointments, setAppointments] = useState([]);
  const [active, setActive] = useState("home");
  const [apptFilter, setApptFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [flash, setFlash] = useState({ type: "", text: "" });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUser = async () => {
    try {
      const res = await axios.post(`${API}/api/user/getuserdata`, {}, { headers });
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem("userData", JSON.stringify(res.data.data));
        if (res.data.data.role === "doctor") navigate("/doctorhome");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API}/api/user/getuserappointments`, {
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
    fetchUser();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  // A doctor applicant whose account has not been verified yet only sees a
  // status screen instead of the patient dashboard.
  if (user.role !== "doctor" && ["pending", "rejected"].includes(user.doctorStatus)) {
    return (
      <AwaitingVerification
        status={user.doctorStatus}
        name={user.fullName}
        onRefresh={fetchUser}
        onLogout={logout}
      />
    );
  }

  const unreadCount = (user.notification || []).length;

  const visibleAppointments = appointments.filter((a) => {
    if (apptFilter === "all") return true;
    if (apptFilter === "upcoming") {
      return isUpcoming(a) && !["cancelled", "rejected"].includes(a.status);
    }
    return a.status === apptFilter;
  });

  const openCancel = (a) => setCancelTarget(a);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await axios.put(
        `${API}/api/user/appointments/${cancelTarget._id}/cancel`,
        {},
        { headers }
      );
      setFlash({ type: "success", text: res.data.message });
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      setFlash({
        type: "danger",
        text: err.response?.data?.message || "Could not cancel appointment",
      });
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row min-vh-100">
        <aside className="col-md-3 col-lg-2 bg-dark text-white p-3">
          <h4 className="mb-3">MediConnect</h4>
          <p className="small text-secondary mb-4">
            {user.role === "doctor" ? "Dr. " : ""}
            {user.fullName}
          </p>
          <nav className="nav flex-column gap-2">
            <button
              className={`btn btn-sm text-start ${
                active === "home" ? "btn-light" : "btn-outline-light"
              }`}
              onClick={() => setActive("home")}
            >
              Home
            </button>
            <button
              className={`btn btn-sm text-start ${
                active === "appointments" ? "btn-light" : "btn-outline-light"
              }`}
              onClick={() => setActive("appointments")}
            >
              Appointments
            </button>
            {user.role !== "doctor" && user.doctorStatus !== "rejected" && (
              <button
                className={`btn btn-sm text-start ${
                  active === "apply" ? "btn-light" : "btn-outline-light"
                }`}
                onClick={() => setActive("apply")}
              >
                Apply as Doctor
              </button>
            )}
            <button
              className={`btn btn-sm text-start ${
                active === "notifications" ? "btn-light" : "btn-outline-light"
              }`}
              onClick={() => setActive("notifications")}
            >
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className="btn btn-sm btn-outline-danger text-start mt-3"
              onClick={logout}
            >
              Logout
            </button>
          </nav>
        </aside>

        <main className="col-md-9 col-lg-10 p-4">
          <header className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">User Dashboard</h3>
            <span className="badge bg-primary">
              {user.role === "doctor" ? "Doctor" : "Patient"}
            </span>
          </header>

          {flash.text && (
            <div className={`alert alert-${flash.type}`} role="alert">
              {flash.text}
            </div>
          )}

          {active === "home" && (
            <div>
              <h4 className="mb-3">Find a Doctor</h4>
              <DoctorBrowser
                userdata={user}
                token={token}
                onBooked={fetchAppointments}
              />
            </div>
          )}

          {active === "appointments" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">My Appointments</h4>
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm w-auto"
                    value={apptFilter}
                    onChange={(e) => setApptFilter(e.target.value)}
                    aria-label="Filter by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="upcoming">Upcoming</option>
                    {APPT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAppointments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No appointments
                        </td>
                      </tr>
                    )}
                    {visibleAppointments.map((a) => (
                      <tr key={a._id}>
                        <td>{a.docName || a.doctorInfo?.fullName}</td>
                        <td>{a.date}</td>
                        <td>
                          <span className={`badge status-${a.status}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          {["pending", "approved"].includes(a.status) && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openCancel(a)}
                            >
                              Cancel
                            </button>
                          )}
                          {["completed", "cancelled", "rejected"].includes(
                            a.status
                          ) && (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === "apply" && (
            <ApplyDoctor
              userId={user._id}
              token={token}
              onApplied={fetchUser}
            />
          )}

          {active === "notifications" && (
            <NotificationPanel user={user} setUser={setUser} token={token} />
          )}
        </main>
      </div>

      <ConfirmModal
        show={!!cancelTarget}
        title="Cancel this appointment?"
        confirmLabel="Cancel appointment"
        busy={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      >
        {cancelTarget && (
          <p className="mb-0">
            Cancel your appointment with{" "}
            <strong>{cancelTarget.docName || cancelTarget.doctorInfo?.fullName}</strong>{" "}
            on <strong>{cancelTarget.date}</strong>? The doctor will be notified and
            the slot will be released.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}