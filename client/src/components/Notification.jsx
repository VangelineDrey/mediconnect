import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8001";

export default function NotificationPanel({ user, setUser, token }) {
  const [loading, setLoading] = useState(false);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/user/getallnotification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setUser(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/user/deleteallnotification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setUser(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unread = user.notification || [];
  const read = user.seennotification || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Notifications</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleMarkAllRead}
            disabled={loading || unread.length === 0}
          >
            Mark all read
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleDeleteAll}
            disabled={loading || read.length === 0}
          >
            Delete all read
          </button>
        </div>
      </div>

      <h5>Unread</h5>
      {unread.length === 0 && <p className="text-muted">No unread notifications.</p>}
      <ul className="list-group mb-4">
        {unread.map((n, i) => (
          <li key={i} className="list-group-item">
            {n.message}
          </li>
        ))}
      </ul>

      <h5>Read</h5>
      {read.length === 0 && <p className="text-muted">No read notifications.</p>}
      <ul className="list-group">
        {read.map((n, i) => (
          <li key={i} className="list-group-item text-muted">
            {n.message}
          </li>
        ))}
      </ul>
    </div>
  );
}