import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import ConfirmModal from "../components/ConfirmModal.jsx";
import axios from "axios";

const API = "http://localhost:8001";

const emptyUser = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "patient",
  doctorStatus: "none",
};

const emptyDoctor = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  specialization: "",
  experience: "",
  fees: "",
  timings: "",
};

export default function AdminHome() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [user] = useState(() => {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw) : null;
  });

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [alert, setAlert] = useState({ type: "", text: "" });

  // modal state
  const [userModal, setUserModal] = useState({ show: false, mode: "create", data: null });
  const [doctorModal, setDoctorModal] = useState({ show: false, mode: "edit", data: null });
  const [form, setForm] = useState(emptyUser);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({
    show: false,
    title: "",
    body: null,
    confirmLabel: "Delete",
    action: null,
    busy: false,
  });

  const headers = { Authorization: `Bearer ${token}` };

  const notify = (type, text) => {
    setAlert({ type, text });
    if (text) setTimeout(() => setAlert({ type: "", text: "" }), 3500);
  };

  const fetchAll = async () => {
    try {
      const [u, d, a] = await Promise.all([
        axios.get(`${API}/api/admin/getallusers`, { headers }),
        axios.get(`${API}/api/admin/getalldoctors`, { headers }),
        axios.get(`${API}/api/admin/getallAppointmentsAdmin`, { headers }),
      ]);
      if (u.data.success) setUsers(u.data.data || []);
      if (d.data.success) setDoctors(d.data.data || []);
      if (a.data.success) setAppointments(a.data.data || []);
    } catch (err) {
      notify("danger", err.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      navigate(user.role === "doctor" ? "/doctorhome" : "/userhome");
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ----------------------------- helpers ----------------------------- */

  const handleField = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleDoctorField = (e) =>
    setDoctorForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /** Does the account currently being edited have a doctor profile? */
  const editingUserHasProfile = userModal.data
    ? doctors.some((d) => String(d.userId) === String(userModal.data._id))
    : false;

  /* ------------------- confirm modal helpers ------------------- */

  const askDelete = ({ title, body, confirmLabel = "Delete", action }) =>
    setConfirm({ show: true, title, body, confirmLabel, action, busy: false });

  const closeConfirm = () =>
    setConfirm((p) => ({ ...p, show: false, busy: false, action: null }));

  const runConfirm = async () => {
    if (!confirm.action) return closeConfirm();
    setConfirm((p) => ({ ...p, busy: true }));
    try {
      await confirm.action();
      closeConfirm();
    } catch (err) {
      notify("danger", err.response?.data?.message || "Action failed");
      setConfirm((p) => ({ ...p, busy: false }));
    }
  };

  /* ------------------------------ users ------------------------------ */

  const openCreateUser = () => {
    setForm(emptyUser);
    setUserModal({ show: true, mode: "create", data: null });
  };

  const openEditUser = (u) => {
    setForm({
      fullName: u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      password: "",
      role: u.role || "patient",
      doctorStatus: u.doctorStatus || "none",
    });
    setUserModal({ show: true, mode: "edit", data: u });
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = userModal.mode === "edit";
      const payload = isEdit
        ? {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            role: form.role,
            doctorStatus: form.doctorStatus,
            ...(form.password ? { password: form.password } : {}),
          }
        : form;

      const res = isEdit
        ? await axios.put(`${API}/api/admin/users/${userModal.data._id}`, payload, { headers })
        : await axios.post(`${API}/api/admin/users`, payload, { headers });

      notify("success", res.data.message);
      setUserModal({ show: false, mode: "create", data: null });
      fetchAll();
    } catch (err) {
      notify("danger", err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (u) =>
    askDelete({
      title: "Delete this user?",
      confirmLabel: "Delete user",
      body: (
        <>
          <p className="mb-2">
            You are about to delete{" "}
            <strong>{u.fullName}</strong> ({u.email}).
          </p>
          <p className="mb-0 text-muted small">
            Their doctor profile and every appointment linked to them will also
            be permanently removed. This cannot be undone.
          </p>
        </>
      ),
      action: async () => {
        const res = await axios.delete(`${API}/api/admin/users/${u._id}`, { headers });
        notify("success", res.data.message);
        await fetchAll();
      },
    });

  /* ----------------------------- doctors ----------------------------- */

  const openEditDoctor = (d) => {
    setDoctorForm({
      fullName: d.fullName || "",
      email: d.email || "",
      phone: d.phone || "",
      address: d.address || "",
      specialization: d.specialization || "",
      experience: d.experience || "",
      fees: d.fees ?? "",
      timings: Array.isArray(d.timings) ? d.timings.join(", ") : d.timings || "",
    });
    setDoctorModal({ show: true, mode: "edit", data: d });
  };

  const submitDoctor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/api/admin/doctors/${doctorModal.data._id}`,
        {
          ...doctorForm,
          fees: Number(doctorForm.fees) || 0,
          timings: doctorForm.timings
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        { headers }
      );
      notify("success", res.data.message);
      setDoctorModal({ show: false, mode: "edit", data: null });
      fetchAll();
    } catch (err) {
      notify("danger", err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteDoctor = (d) =>
    askDelete({
      title: "Delete this doctor profile?",
      confirmLabel: "Delete profile",
      body: (
        <>
          <p className="mb-2">
            You are about to remove{" "}
            <strong>Dr. {d.fullName}</strong> ({d.specialization}) from the
            platform.
          </p>
          <p className="mb-0 text-muted small">
            All of their appointments will be deleted and their account will be
            demoted back to a patient.
          </p>
        </>
      ),
      action: async () => {
        const res = await axios.delete(`${API}/api/admin/doctors/${d._id}`, { headers });
        notify("success", res.data.message);
        await fetchAll();
      },
    });

  const setDoctorStatus = async (d, status) => {
    try {
      const endpoint = status === "approved" ? "getapprove" : "getreject";
      const res = await axios.post(`${API}/api/admin/${endpoint}`, { doctorId: d._id }, { headers });
      notify("success", res.data.message);
      fetchAll();
    } catch (err) {
      notify("danger", err.response?.data?.message || "Update failed");
    }
  };

  /* -------------------------- appointments --------------------------- */

  const setAppointmentStatus = async (a, status) => {
    try {
      const res = await axios.put(
        `${API}/api/admin/appointments/${a._id}`,
        { status },
        { headers }
      );
      notify("success", res.data.message);
      fetchAll();
    } catch (err) {
      notify("danger", err.response?.data?.message || "Update failed");
    }
  };

  const deleteAppointment = (a) =>
    askDelete({
      title: "Delete this appointment?",
      confirmLabel: "Delete appointment",
      body: (
        <p className="mb-0">
          Remove the appointment for{" "}
          <strong>{a.userInfo?.fullName}</strong> with{" "}
          <strong>{a.doctorInfo?.fullName}</strong> on{" "}
          <strong>{a.date}</strong>?
        </p>
      ),
      action: async () => {
        const res = await axios.delete(`${API}/api/admin/appointments/${a._id}`, { headers });
        notify("success", res.data.message);
        await fetchAll();
      },
    });

  const statusBadge = (s) => (
    <span className={`badge status-${String(s).toLowerCase()}`}>{s}</span>
  );

  /* ------------------------------ render ----------------------------- */

  return (
    <div className="container-fluid">
      <div className="row min-vh-100">
        <aside className="col-md-3 col-lg-2 bg-dark text-white p-3">
          <h4 className="mb-4">Admin</h4>
          {[
            ["users", `Users (${users.length})`],
            ["doctors", `Doctors (${doctors.length})`],
            ["appointments", `Appointments (${appointments.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm w-100 text-start mb-2 ${
                tab === key ? "btn-light" : "btn-outline-light"
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
          <button className="btn btn-sm btn-outline-danger w-100 mt-3" onClick={logout}>
            Logout
          </button>
        </aside>

        <main className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Admin Dashboard</h3>
            {tab === "users" && (
              <Button variant="primary" size="sm" onClick={openCreateUser}>
                + Add User
              </Button>
            )}
          </div>

          {alert.text && (
            <div className={`alert alert-${alert.type}`} role="alert">
              {alert.text}
            </div>
          )}

          {/* ----------------------------- USERS ---------------------------- */}
          {tab === "users" && (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Doctor App.</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No users
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className={`badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>{statusBadge(u.doctorStatus || "none")}</td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEditUser(u)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteUser(u)}
                          disabled={u._id === user._id}
                          title={u._id === user._id ? "You cannot delete yourself" : ""}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------------------------- DOCTORS --------------------------- */}
          {tab === "doctors" && (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>Fees</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No doctors
                      </td>
                    </tr>
                  )}
                  {doctors.map((d) => (
                    <tr key={d._id}>
                      <td>
                        {d.fullName}
                        <div className="small text-muted">{d.email}</div>
                      </td>
                      <td>{d.specialization}</td>
                      <td>{d.fees}</td>
                      <td>{statusBadge(d.status)}</td>
                      <td className="text-end text-nowrap">
                        {d.status === "pending" && (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => setDoctorStatus(d, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger me-2"
                              onClick={() => setDoctorStatus(d, "rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEditDoctor(d)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteDoctor(d)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -------------------------- APPOINTMENTS ------------------------ */}
          {tab === "appointments" && (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No appointments
                      </td>
                    </tr>
                  )}
                  {appointments.map((a) => (
                    <tr key={a._id}>
                      <td>
                        {a.userInfo?.fullName}
                        <div className="small text-muted">{a.userInfo?.email}</div>
                      </td>
                      <td>{a.doctorInfo?.fullName}</td>
                      <td>{a.date}</td>
                      <td>{statusBadge(a.status)}</td>
                      <td className="text-end text-nowrap">
                        <select
                          className="form-select form-select-sm d-inline-block w-auto me-2"
                          value={a.status}
                          onChange={(e) => setAppointmentStatus(a, e.target.value)}
                        >
                          {["pending", "approved", "rejected", "completed", "cancelled"].map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                        </select>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteAppointment(a)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------- USER MODAL ------------------------- */}
      <Modal
        show={userModal.show}
        onHide={() => setUserModal({ show: false, mode: "create", data: null })}
        centered
        enforceFocus={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {userModal.mode === "create" ? "Add User" : "Edit User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitUser}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                name="fullName"
                value={form.fullName}
                onChange={handleField}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleField}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleField}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Password{" "}
                {userModal.mode === "edit" && (
                  <span className="text-muted fw-normal">(leave blank to keep)</span>
                )}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleField}
                required={userModal.mode === "create"}
                minLength={6}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={form.role} onChange={handleField}>
                <option value="patient">patient</option>
                <option value="doctor" disabled={!editingUserHasProfile}>
                  doctor{editingUserHasProfile ? "" : " (no profile)"}
                </option>
                <option value="admin">admin</option>
              </Form.Select>
              {userModal.mode === "edit" && (
                <Form.Text
                  className={
                    editingUserHasProfile
                      ? "text-muted"
                      : "text-warning"
                  }
                >
                  {editingUserHasProfile
                    ? "Changes to name, email and phone are synced to this doctor's profile."
                    : "The doctor role requires an approved doctor profile. Approve their application from the Doctors tab."}
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Doctor Application Status</Form.Label>
              <Form.Select
                name="doctorStatus"
                value={form.doctorStatus}
                onChange={handleField}
              >
                {["none", "pending", "approved", "rejected"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
              {userModal.mode === "edit" && editingUserHasProfile && (
                <Form.Text className="text-muted">
                  This drives the doctor profile too. Only an{" "}
                  <strong>approved</strong> profile appears on the patient
                  doctor list.
                </Form.Text>
              )}
            </Form.Group>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ------------------------ DOCTOR MODAL ------------------------ */}
      <Modal
        show={doctorModal.show}
        onHide={() => setDoctorModal({ show: false, mode: "edit", data: null })}
        centered
        enforceFocus={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Doctor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitDoctor}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                name="fullName"
                value={doctorForm.fullName}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                value={doctorForm.email}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={doctorForm.phone}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                name="address"
                value={doctorForm.address}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                name="specialization"
                value={doctorForm.specialization}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Experience</Form.Label>
              <Form.Control
                name="experience"
                value={doctorForm.experience}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fees</Form.Label>
              <Form.Control
                type="number"
                name="fees"
                value={doctorForm.fees}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Timings (comma separated)</Form.Label>
              <Form.Control
                name="timings"
                value={doctorForm.timings}
                onChange={handleDoctorField}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ------------------- CONFIRM MODAL ------------------- */}
      <ConfirmModal
        show={confirm.show}
        title={confirm.title}
        confirmLabel={confirm.confirmLabel}
        busy={confirm.busy}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      >
        {confirm.body}
      </ConfirmModal>
    </div>
  );
}