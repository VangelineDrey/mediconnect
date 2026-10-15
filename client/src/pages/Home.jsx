import { Link } from "react-router-dom";
import heroImg from "../assets/hero.png";

export default function Home() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand fw-bold">MediConnect</span>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-light btn-sm">
              Login
            </Link>
            <Link to="/register/doctor" className="btn btn-outline-light btn-sm">
              Doctor Sign Up
            </Link>
            <Link to="/register" className="btn btn-outline-light btn-sm">
              Patient Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container my-5">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-5 fw-bold hero-title">
                Book a Doctor With Ease
              </h1>
              <p className="lead">
                Find healthcare providers, schedule appointments, and manage
                medical records in one place.
              </p>
              <Link to="/login" className="btn btn-primary me-2">
                Get Started
              </Link>
              <Link to="/register" className="btn btn-outline-primary me-2">
                Create Account
              </Link>
              <Link to="/register/doctor" className="btn btn-pastel-green">
                Register as Doctor
              </Link>
            </div>
            <div className="col-md-6 text-center">
              <img
                src={heroImg}
                alt="MediConnect healthcare booking"
                className="img-fluid"
                style={{ maxWidth: "320px" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-light py-5">
        <div className="container">
          <h2 className="mb-4">About</h2>
          <p>
            MediConnect streamlines hospital appointment management for patients,
            doctors, and administrators with secure authentication, doctor
            browsing, appointment booking, document upload, and real-time
            notifications.
          </p>
        </div>
      </section>

      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <small>MediConnect &copy; 2026</small>
      </footer>
    </div>
  );
}