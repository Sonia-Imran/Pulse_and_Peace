import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Droplet,
  Calendar,
  Camera,
  Edit3,
  Save,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Header from "../../../Components/Header/Header";
import Footer from "../../../Components/Footer/Footer";
import API from "../../../api";
import ImageUpload from "../../../Components/ImageUpload/ImageUpload";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await API.get("/patient/profile");
      setUser(data.data);
      setFormData(data.data);
      if (data.data.profilePic) setProfilePic(data.data.profilePic);
    } catch {
      const saved = JSON.parse(localStorage.getItem("patient_profile") || "{}");
      if (saved._id) {
        setUser(saved);
        setFormData(saved);
        if (saved.profilePic) setProfilePic(saved.profilePic);
      }
    }
  };

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.put("/patient/profile", {
        fullName: formData.fullName,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        age: formData.age,
        gender: formData.gender,
        dob: formData.dob,
        city: formData.city,
      });

      if (profilePic && profilePic !== user?.profilePic) {
        await API.put("/patient/profile/pic", { profilePic });
      }

      await loadProfile();
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      setSaveSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setProfilePic(user?.profilePic || null);
    setEditing(false);
    setActiveTab("overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("user-token");
    localStorage.removeItem("patient_profile");
    localStorage.removeItem("doctor-token");
    localStorage.removeItem("doctor_profile");
    localStorage.removeItem("admin-token");
    window.location.href = "/login";
  };

  return (
    <>
      <Header />
      <div className="pp-root">
        <div className="pp-blob pp-blob-1" />
        <div className="pp-blob pp-blob-2" />

        {saveSuccess && (
          <div className="pp-toast">Profile saved successfully!</div>
        )}

        <div className="pp-wrapper">
          <div className="pp-grid">
            <aside className="pp-sidebar">
              <div className="pp-avatar-section">
                <div className="pp-avatar-ring">
                  <div
                    className="pp-avatar"
                    onClick={() => editing && fileInputRef.current.click()}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="pp-avatar-img"
                      />
                    ) : (
                      <span className="pp-avatar-initials">
                        {(user?.fullName || "P")[0].toUpperCase()}
                      </span>
                    )}
                    {editing && (
                      <div className="pp-avatar-overlay">
                        <Camera size={22} color="#fff" />
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handlePicUpload}
                />
                <h2 className="pp-name">{user?.fullName || "Patient"}</h2>
                <span className="pp-role-badge">Patient</span>
              </div>

              <div className="pp-info-list">
                <div className="pp-info-item">
                  <Mail size={15} className="pp-info-icon" />
                  <span>{user?.email || "—"}</span>
                </div>
                <div className="pp-info-item">
                  <Phone size={15} className="pp-info-icon" />
                  <span>{user?.phone || "Not provided"}</span>
                </div>
                <div className="pp-info-item">
                  <Droplet size={15} className="pp-info-icon" />
                  <span>Blood: {user?.bloodGroup || "N/A"}</span>
                </div>
                <div className="pp-info-item">
                  <Calendar size={15} className="pp-info-icon" />
                  <span>
                    Member since{" "}
                    {new Date(user?.createdAt || Date.now()).getFullYear()}
                  </span>
                </div>
              </div>

              <nav className="pp-sidenav">
                {[
                  {
                    id: "overview",
                    icon: <User size={16} />,
                    label: "My Profile",
                  },
                  {
                    id: "edit",
                    icon: <Edit3 size={16} />,
                    label: "Edit Profile",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`pp-sidenav-btn ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === "edit") setEditing(true);
                      else setEditing(false);
                    }}
                  >
                    {item.icon}
                    {item.label}
                    <ChevronRight size={14} className="pp-sidenav-arrow" />
                  </button>
                ))}
              </nav>

              <button className="pp-logout-btn" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </aside>

            <main className="pp-main">
              {activeTab === "overview" && (
                <div className="pp-tab-content">
                  <h3 className="pp-section-title">My Profile</h3>
                  <div className="pp-profile-card">
                    <div className="pp-profile-avatar-lg">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt="Profile"
                          className="pp-avatar-img"
                        />
                      ) : (
                        <span className="pp-profile-initials">
                          {(user?.fullName || "P")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="pp-profile-details">
                      <h2 className="pp-profile-name">
                        {user?.fullName || "Patient"}
                      </h2>
                      <span className="pp-profile-badge">Patient</span>
                    </div>
                  </div>
                  <div className="pp-detail-grid">
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <User size={14} /> Full Name
                      </span>
                      <span className="pp-detail-value">
                        {user?.fullName || "—"}
                      </span>
                    </div>
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <Mail size={14} /> Email
                      </span>
                      <span className="pp-detail-value">
                        {user?.email || "—"}
                      </span>
                    </div>
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <Phone size={14} /> Phone
                      </span>
                      <span className="pp-detail-value">
                        {user?.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <Droplet size={14} /> Blood Group
                      </span>
                      <span className="pp-detail-value">
                        {user?.bloodGroup || "N/A"}
                      </span>
                    </div>
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <Calendar size={14} /> Date of Birth
                      </span>
                      <span className="pp-detail-value">
                        {user?.dob || "N/A"}
                      </span>
                    </div>
                    <div className="pp-detail-item">
                      <span className="pp-detail-label">
                        <User size={14} /> City
                      </span>
                      <span className="pp-detail-value">
                        {user?.city || "N/A"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="pp-edit-trigger-btn"
                    onClick={() => {
                      setActiveTab("edit");
                      setEditing(true);
                    }}
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                </div>
              )}

              {activeTab === "edit" && (
                <div className="pp-tab-content">
                  <div className="pp-edit-header">
                    <h3 className="pp-section-title">Edit Profile</h3>
                    <div className="pp-edit-actions">
                      <button className="pp-cancel-btn" onClick={handleCancel}>
                        <X size={15} /> Cancel
                      </button>
                      <button
                        className="pp-save-btn"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save size={15} />{" "}
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                  <div className="pp-upload-section">
                    <ImageUpload
                      value={profilePic}
                      onChange={async (url) => {
                        setProfilePic(url);
                        try {
                          await API.put("/patient/profile/pic", {
                            profilePic: url,
                          });
                        } catch {}
                      }}
                      folder="pulse_and_peace/patients"
                      placeholder="Upload Profile Photo"
                    />
                  </div>
                  <div className="pp-form-grid">
                    {[
                      {
                        label: "Full Name",
                        key: "fullName",
                        icon: <User size={15} />,
                        type: "text",
                      },
                      {
                        label: "Email",
                        key: "email",
                        icon: <Mail size={15} />,
                        type: "email",
                      },
                      {
                        label: "Phone Number",
                        key: "phone",
                        icon: <Phone size={15} />,
                        type: "tel",
                      },
                      {
                        label: "Blood Group",
                        key: "bloodGroup",
                        icon: <Droplet size={15} />,
                        type: "text",
                      },
                      {
                        label: "Date of Birth",
                        key: "dob",
                        icon: <Calendar size={15} />,
                        type: "date",
                      },
                      {
                        label: "City",
                        key: "city",
                        icon: <User size={15} />,
                        type: "text",
                      },
                    ].map((field) => (
                      <div key={field.key} className="pp-form-group">
                        <label className="pp-form-label">
                          {field.icon} {field.label}
                        </label>
                        <input
                          className="pp-form-input"
                          type={field.type}
                          value={formData[field.key] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.key]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${field.label}`}
                          disabled={field.key === "email"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
