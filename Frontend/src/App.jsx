import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./Components/AdminLayout/AdminLayout";
import Dashboard from "./Pages/Admin/Dashboard/dashboard";
import SignUp from "./Pages/Auth/SignUp/signup";
import Login from "./Pages/Auth/Login/login";
import Home from "./Pages/Users/Home/home";
import Profile from "./Pages/Users/Profile/Profile";
import DoctorLayout from "./Components/DoctorLayout/DoctorLayout";
import DoctorDashboard from './Pages/Doctors/DoctorDashboard/DoctorDashboard';
import DoctorAppointments from "./Pages/Doctors/DoctorAppointments/DoctorAppointments";
import MyPatients from "./Pages/Doctors/MyPatients/MyPatients";
import Consultations from "./Pages/Doctors/Consultation/Consultations";
import PatientRecords from "./Pages/Doctors/PatientsRecords/PatientRecords";
import DoctorServices from "./Pages/Doctors/DoctorServices/DoctorServices";
import PatientsTracker from "./Pages/Admin/PatientsTracker/PatientsTracker";
import DoctorsTracker from "./Pages/Admin/DoctorsTracker/DoctorsTracker";
import AppointmentsTracker from './Pages/Admin/AppointmentsTracker/AppointmentsTracker';
import ServicesVerification from "./Pages/Admin/AdminServices/ServicesVerification";
import PaymentsTracker from "./Pages/Admin/PaymentsTracker/PaymentsTracker";
import DoctorEarnings from "./Pages/Doctors/DoctorEarnings/DoctorEarnings";
import ConsultationChat from "./Pages/Users/ConsultationChat/ConsultationChat";
import MyAppointments from "./Pages/Users/MyAppointments/MyAppointments";

function AppRoutes() {
  const location = useLocation();
  const adminToken  = localStorage.getItem('admin-token');
  const userToken   = localStorage.getItem('user-token');
  const DoctorToken = localStorage.getItem('doctor-token');

  const isAdminPath = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/DoctorsTracker') ||
    location.pathname.startsWith('/PatientsTracker') ||
    location.pathname.startsWith('/AppointmentsTracker') ||
    location.pathname.startsWith('/ServicesVerification') ||
    location.pathname.startsWith('/PaymentsTracker');

  const isDoctorPath = location.pathname.startsWith('/doctor');

  if (adminToken && isAdminPath) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/dashboard"             element={<Dashboard />} />
          <Route path="/DoctorsTracker"        element={<DoctorsTracker />} />
          <Route path="/PatientsTracker"       element={<PatientsTracker />} />
          <Route path="/AppointmentsTracker"   element={<AppointmentsTracker />} />
          <Route path="/ServicesVerification"  element={<ServicesVerification />} />
          <Route path="/PaymentsTracker"       element={<PaymentsTracker />} />
          <Route path="*"                      element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (DoctorToken && isDoctorPath) {
    return (
      <Routes>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index                         element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"              element={<DoctorDashboard />} />
          <Route path="appointments"           element={<DoctorAppointments />} />
          <Route path="patients"               element={<MyPatients />} />
          <Route path="text-consultations"     element={<Consultations />} />
          <Route path="records"                element={<PatientRecords />} />
          <Route path="services"               element={<DoctorServices />} />
          <Route path="DoctorEarnings"         element={<DoctorEarnings />} />
        </Route>
        <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login"              element={!userToken ? <Login />            : <Navigate to="/" replace />} />
      <Route path="/signup"             element={!userToken ? <SignUp />           : <Navigate to="/" replace />} />
      <Route path="/"                   element={userToken  ? <Home />             : <Navigate to="/login" replace />} />
      <Route path="/Profile"            element={userToken  ? <Profile />          : <Navigate to="/login" replace />} />
      <Route path="/my-appointments"    element={userToken  ? <MyAppointments />   : <Navigate to="/login" replace />} />
      <Route path="/consultation/:id"   element={userToken  ? <ConsultationChat /> : <Navigate to="/login" replace />} />
      <Route path="*"                   element={<Navigate to={userToken ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    localStorage.setItem('admin-data', JSON.stringify({
      name: "Admin", email: "admin@gmail.com",
      password: "admin123@", role: "admin",
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('doctor-data', JSON.stringify({
      name: "Doctor", email: "doctor@gmail.com",
      password: "doctor123@", role: "doctor",
    }));
  }, []);

  return <AppRoutes />;
}

export default App;
