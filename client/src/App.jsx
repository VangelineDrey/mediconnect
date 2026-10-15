import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DoctorRegister from "./pages/DoctorRegister.jsx";
import UserHome from "./pages/UserHome.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import DoctorHome from "./pages/DoctorHome.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/doctor" element={<DoctorRegister />} />
      <Route path="/userhome" element={<UserHome />} />
      <Route path="/adminhome" element={<AdminHome />} />
      <Route path="/doctorhome" element={<DoctorHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;