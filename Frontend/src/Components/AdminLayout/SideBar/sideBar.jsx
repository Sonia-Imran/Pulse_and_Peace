import { Menu, Avatar } from 'antd'
import React, { useState, useEffect } from 'react'
import {
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  BankOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import './sideBar.css'

function SideBar({ setTabName }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin Unit',
    role: 'Super Control',
    avatar: null,
  })

  useEffect(() => {
    loadProfile()
    window.addEventListener('admin-profile-updated', loadProfile)
    return () => window.removeEventListener('admin-profile-updated', loadProfile)
  }, [])

  const loadProfile = () => {
    const saved = localStorage.getItem('admin-profile')
    if (saved) setAdminProfile(JSON.parse(saved))
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    localStorage.removeItem('doctor-token')
    localStorage.removeItem('doctor_profile')
    localStorage.removeItem('user-token')
    localStorage.removeItem('patient_profile')
    window.location.href='/login'
  }

  const items = [
    { key: '/dashboard', icon: <PieChartOutlined />, label: 'Dashboard', tabLabel: 'Dashboard' },
    { key: '/PatientsTracker', icon: <UserOutlined />, label: 'Patients', tabLabel: 'Patients Tracker' },
    { key: '/DoctorsTracker', icon: <UserOutlined />, label: 'Doctors', tabLabel: 'Doctors Tracker' },
    { key: '/AppointmentsTracker', icon: <ContainerOutlined />, label: 'Appointments', tabLabel: 'Appointments Tracker' },
    { key: '/ServicesVerification', icon: <AppstoreOutlined />, label: 'Services', tabLabel: 'Services Verification' },
    { key: '/PaymentsTracker', icon: <BankOutlined />, label: 'Payment Tracker', tabLabel: 'Payments Tracker' },
  ]

  const onMenuClick = (info) => {
    navigate(info.key)
    const target = items.find(item => item.key === info.key)
    if (target) setTabName(target.tabLabel || target.label)
  }

  return (
    <div className="sidebar-wrapper">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <HeartOutlined />
          </div>
          <h3 className="brand-title">Pulse & Peace</h3>
        </div>

        <div className="sidebar-profile-card">
          <Avatar
            size={44}
            src={adminProfile.avatar}
            icon={!adminProfile.avatar && <SafetyCertificateOutlined />}
            className="profile-avatar"
          />
          <div className="profile-meta">
            <span className="profile-name">{adminProfile.name}</span>
            <span className="profile-role">{adminProfile.role}</span>
          </div>
        </div>

        <div className="sidebar-menu-label">Main Menu</div>

        <Menu
          selectedKeys={[location.pathname]}
          mode="inline"
          theme="light"
          items={items}
          onClick={onMenuClick}
          className="sidebar-menu"
        />
      </div>

      <div className="sidebar-footer">
        <div className="logout-btn" onClick={handleLogout}>
          <LogoutOutlined />
          <span>Logout</span>
        </div>
      </div>
    </div>
  )
}

export default SideBar