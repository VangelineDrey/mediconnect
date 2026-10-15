import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { DatePicker } from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import axios from "axios";

const API = "http://localhost:8001";

export default function DoctorList({ doctor, userdata, token, onBooked }) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleClose = () => {
    setShow(false);
    setDate(null);
    setFile(null);
    setMsg("");
  };
  const handleShow = () => setShow(true);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!date) {
      setMsg("Please select date and time");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.append("date", date.format("YYYY-MM-DD HH:mm"));
      formData.append("userInfo", JSON.stringify(userdata));
      formData.append("doctorInfo", JSON.stringify(doctor));
      if (file) formData.append("image", file);

      await axios.post(`${API}/api/user/getappointment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMsg("Appointment booked successfully");
      if (onBooked) onBooked();
      setTimeout(() => handleClose(), 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <h5 className="card-title">{doctor.fullName}</h5>
        <p className="mb-1">
          <strong>Specialization:</strong> {doctor.specialization}
        </p>
        <p className="mb-1">
          <strong>Experience:</strong> {doctor.experience}
        </p>
        <p className="mb-1">
          <strong>Fees:</strong> {doctor.fees}
        </p>
        <p className="mb-1">
          <strong>Timings:</strong>{" "}
          {Array.isArray(doctor.timings)
            ? doctor.timings.join(" - ")
            : doctor.timings}
        </p>
        <p className="mb-2">
          <strong>Address:</strong> {doctor.address}
        </p>
        <Button variant="primary" onClick={handleShow}>
          Book Now
        </Button>
      </div>

      <Modal
        show={show}
        onHide={handleClose}
        centered
        enforceFocus={false}
        backdrop={true}
        keyboard={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Book Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {msg && <div className="alert alert-info">{msg}</div>}
          <Form onSubmit={handleBook}>
            <Form.Group className="mb-3">
              <Form.Label>Date &amp; Time</Form.Label>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                value={date}
                onChange={(value) => setDate(value)}
                size="large"
                style={{ width: "100%" }}
                placeholder="Select date and time"
                getPopupContainer={(trigger) => trigger.parentNode}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
              {date && (
                <small className="text-muted">
                  Selected: {date.format("YYYY-MM-DD HH:mm")}
                </small>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload Document (optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}