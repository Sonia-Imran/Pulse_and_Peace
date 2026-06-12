import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { LogIn, UserPlus, User, LogOut, ChevronDown, Bell, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import "./Header.css";

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOpen, setIsOpen]               = useState(false);
  const [patient, setPatient]             = useState(null);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [apptOpen, setApptOpen]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments]   = useState([]);
  const notifRef = useRef(null);
  const apptRef  = useRef(null);

  useEffect(() => {
    const savedPatient = localStorage.getItem("patient_profile");
    const userToken    = localStorage.getItem("user-token");
    if (savedPatient && userToken) {
      const data = JSON.parse(savedPatient);
      if (data.role === "patient" || data.role === "user") setPatient(data);
      else setPatient(null);
    } else {
      setPatient(null);
    }
    loadNotifications();
    loadAppointments();
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
      loadAppointments();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (apptRef.current  && !apptRef.current.contains(e.target))  setApptOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadNotifications = () => {
    const appts = JSON.parse(localStorage.getItem("pp_appointments") || "[]");
    const notifs = appts
      .filter(a => a.consultType === "doctor")
      .map(a => ({
        id:      a.id,
        title:   a.status === "accepted" ? "Appointment Approved!" : a.status === "rejected" ? "Appointment Rejected" : "Appointment Pending",
        message: a.status === "accepted"
          ? `Your ${a.type} appointment on ${a.date} has been approved. Please complete payment.`
          : a.status === "rejected"
          ? `Your ${a.type} appointment has been rejected by the doctor.`
          : `Your ${a.type} appointment request is pending approval.`,
        status:  a.status,
        time:    a.date || "",
        read:    a.notifRead || false,
      }));
    setNotifications(notifs);
  };

  const loadAppointments = () => {
    const appts = JSON.parse(localStorage.getItem("pp_appointments") || "[]");
    setAppointments(appts.filter(a => a.consultType === "doctor"));
  };

  const markAllRead = () => {
    const appts = JSON.parse(localStorage.getItem("pp_appointments") || "[]");
    const updated = appts.map(a => ({ ...a, notifRead: true }));
    localStorage.setItem("pp_appointments", JSON.stringify(updated));
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("patient_profile");
    localStorage.removeItem("user-token");
    setPatient(null);
    window.location.href = "/login";
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const section = document.getElementById(sectionId);
      if (section) section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const statusIcon = (status) => {
    if (status === "accepted")  return <CheckCircle size={14} className="notif-status-icon accepted" />;
    if (status === "rejected")  return <XCircle      size={14} className="notif-status-icon rejected" />;
    return                              <Clock       size={14} className="notif-status-icon pending"  />;
  };

  const paymentStatus = (appt) => {
    const payments  = JSON.parse(localStorage.getItem("localPayments") || "[]");
    const payRecord = payments.find(p => p.appointmentId === appt.id);
    return payRecord?.status === "paid" || appt.paymentStatus === "Paid" || appt.paymentStatus === "paid" ? "paid" : "unpaid";
  };

  return (
    <>
      <div className="ticker-bar">
        <div className="ticker-content">
          <span>Your health is our priority — compassionate care, trusted doctors, peaceful minds. &nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>Your health is our priority — compassionate care, trusted doctors, peaceful minds. &nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      <header>
        <div className="container">
          <nav>
            <div className="logo-text" onClick={() => navigate("/")}>
              <img className="logoimg" src="/Images/logoimg.png" alt="Pulse & Peace logo" />
              <h2>Pulse &amp; Peace</h2>
            </div>

            <ul className={isOpen ? "nav-link active" : "nav-link"}>
              <li><a href="#home"    className={location.pathname === "/" ? "active" : ""} onClick={(e) => scrollToSection(e, "home")}>Home</a></li>
              <li><a href="#about"   onClick={(e) => scrollToSection(e, "about")}>About</a></li>
              <li><a href="#services" onClick={(e) => scrollToSection(e, "services")}>Services</a></li>
              <li><a href="#doctors" onClick={(e) => scrollToSection(e, "doctors")}>Our Doctors</a></li>
              <li><a href="#contact" onClick={(e) => scrollToSection(e, "contact")}>Contact</a></li>

              <li className="auth-item">
                {patient ? (
                  <div className="header-right">
                    <div className="notif-wrap" ref={notifRef}>
                      <button className="notif-btn" onClick={() => { setNotifOpen(!notifOpen); setApptOpen(false); }}>
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                      </button>

                      {notifOpen && (
                        <div className="notif-dropdown">
                          <div className="notif-dropdown-header">
                            <span className="notif-dropdown-title">Notifications</span>
                            {unreadCount > 0 && <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>}
                          </div>
                          <div className="notif-list">
                            {notifications.length === 0 ? (
                              <p className="notif-empty">No notifications yet</p>
                            ) : (
                              notifications.map((n, i) => (
                                <div key={i} className={`notif-item ${!n.read ? "unread" : ""}`}>
                                  {statusIcon(n.status)}
                                  <div className="notif-item-body">
                                    <p className="notif-item-title">{n.title}</p>
                                    <p className="notif-item-msg">{n.message}</p>
                                    <p className="notif-item-time">{n.time}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="appt-wrap" ref={apptRef}>
                      <button className="appt-btn" onClick={() => { setApptOpen(!apptOpen); setNotifOpen(false); }}>
                        <Calendar size={18} />
                        {appointments.filter(a => a.status === "accepted" && paymentStatus(a) === "unpaid").length > 0 && (
                          <span className="notif-badge pay-badge">
                            {appointments.filter(a => a.status === "accepted" && paymentStatus(a) === "unpaid").length}
                          </span>
                        )}
                      </button>

                      {apptOpen && (
                        <div className="notif-dropdown appt-dropdown">
                          <div className="notif-dropdown-header">
                            <span className="notif-dropdown-title">My Appointments</span>
                          </div>
                          <div className="notif-list">
                            {appointments.length === 0 ? (
                              <p className="notif-empty">No appointments yet</p>
                            ) : (
                              appointments.map((a, i) => {
                                const paid = paymentStatus(a);
                                return (
                                  <div key={i} className="appt-item">
                                    <div className="appt-item-left">
                                      <p className="appt-item-type">{a.type || "Consultation"}</p>
                                      <p className="appt-item-date">{a.date} · {a.time}</p>
                                      <div className="appt-item-tags">
                                        <span className={`appt-status-tag appt-status-${a.status}`}>
                                          {a.status}
                                        </span>
                                        {a.status === "accepted" && (
                                          <span className={`appt-pay-tag appt-pay-${paid}`}>
                                            {paid === "paid" ? "✓ Paid" : "⚡ Pay Now"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {a.status === "accepted" && paid === "unpaid" && (
                                      <button
                                        className="appt-pay-btn"
                                        onClick={() => { setApptOpen(false); navigate("/my-appointments"); }}
                                      >
                                        Pay
                                      </button>
                                    )}
                                    
                                    {paid === "paid" && (
                                      <button
                                        className="appt-chat-btn"
                                        onClick={() => { setApptOpen(false); navigate(`/consultation/${a.id}`); }}
                                      >
                                        Chat
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="logged-in-section">
                      <div className="profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <div className="avatar-circle">
                          {patient.profilePic ? (
                            <img src={patient.profilePic} alt="avatar" className="avatar-img" />
                          ) : (
                            <span className="avatar-initials">{(patient.fullName || "U")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className="user-name-text">{patient.fullName}</span>
                        <ChevronDown size={15} className="chevron-icon" />
                      </div>
                      {dropdownOpen && (
                        <div className="profile-dropdown">
                          <div className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/Profile"); }}>
                            <User size={15} /> My Profile
                          </div>
                          
                          <div className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/my-appointments"); }}>
                            <Calendar size={15} /> My Appointments
                          </div>
                          
                          <div className="dropdown-divider" />
                          <div className="dropdown-item danger" onClick={handleLogout}>
                            <LogOut size={15} /> Logout
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="auth-btns">
                    <button className="login-btn"  onClick={() => window.location.href = "/login"}>
                      <LogIn size={16} /> Login
                    </button>
                    <button className="signup-btn" onClick={() => window.location.href = "/signup"}>
                      <UserPlus size={16} /> Signup
                    </button>
                  </div>
                )}
              </li>
            </ul>

            <div className="icon" onClick={() => setIsOpen(!isOpen)}>
              <IoMdMenu />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}