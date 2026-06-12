import { useState, useEffect, useRef } from 'react'
import { Badge, Avatar, Typography, Modal, Form, Input, Upload, message } from 'antd'
import {
  BellOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  EditOutlined,
  CameraOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import ImageUpload from '../../../Components/ImageUpload/ImageUpload'
import API from '../../../api'
import './topBar.css'

const { Title, Text } = Typography

function TopBar({ tabName }) {
  const [liveTime, setLiveTime] = useState(new Date())
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('admin-profile')
    return saved ? JSON.parse(saved) : {
      name: 'Admin Unit',
      role: 'Super Control',
      email: 'admin@pulsepeace.com',
      phone: '+92 300 0000000',
      avatar: null,
    }
  })
  const [notifications, setNotifications] = useState([])
  const [form] = Form.useForm()
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadNotifications = async () => {
    try {
      const { data } = await API.get('/notifications')
      setNotifications(data.data || [])
    } catch {
      setNotifications([])
    }
  }

  const currentDay = liveTime.toLocaleDateString('en-US', { weekday: 'long' })
  const currentDate = liveTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      loadNotifications()
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    } catch {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    }
  }

  const openEdit = () => {
    form.setFieldsValue({
      name: adminProfile.name,
      role: adminProfile.role,
      email: adminProfile.email,
      phone: adminProfile.phone,
    })
    setProfileOpen(false)
    setEditModal(true)
  }

  const handleSave = (values) => {
    const updated = { ...adminProfile, ...values }
    setAdminProfile(updated)
    localStorage.setItem('admin-profile', JSON.stringify(updated))
    window.dispatchEvent(new Event('admin-profile-updated'))
    message.success('Profile updated!')
    setEditModal(false)
  }

  const handleAvatar = (info) => {
    const file = info.file.originFileObj || info.file
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const updated = { ...adminProfile, avatar: e.target.result }
        setAdminProfile(updated)
        localStorage.setItem('admin-profile', JSON.stringify(updated))
        window.dispatchEvent(new Event('admin-profile-updated'))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <div className="topbar-wrapper">
        <div className="topbar-left">
          <Title level={2} className="topbar-title">
            {tabName || 'Dashboard'}
          </Title>
        </div>

        <div className="topbar-right">
          <div className="topbar-clock">
            <span className="clock-day">{currentDay}</span>
            <span className="clock-date">{currentDate}</span>
          </div>

          <div className="notif-wrapper" ref={notifRef}>
            <div className="topbar-bell" onClick={() => setNotifOpen(prev => !prev)}>
              <Badge count={unreadCount} size="small">
                <BellOutlined className="bell-icon" />
              </Badge>
            </div>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h4 className="notif-header-title">System Alerts</h4>
                  <span className="notif-mark-read" onClick={markAllRead}>Mark all read</span>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-item"><span className="notif-item-title">No notifications</span></div>
                  ) : notifications.map(item => (
                    <div
                      key={item._id}
                      className={`notif-item ${!item.read ? 'notif-unread' : ''}`}
                      onClick={() => markRead(item._id)}
                    >
                      <InfoCircleOutlined className="notif-item-icon" />
                      <div className="notif-item-text">
                        <span className="notif-item-title">{item.title}</span>
                        <span className="notif-item-desc">{item.message}</span>
                      </div>
                      {!item.read && <span className="notif-unread-dot" />}
                    </div>
                  ))}
                </div>
                <div className="notif-dropdown-footer">
                  <span className="notif-clear" onClick={markAllRead}>Clear all</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-wrapper" ref={profileRef}>
            <div className="topbar-admin-badge" onClick={() => setProfileOpen(prev => !prev)}>
              <Avatar
                size={32}
                src={adminProfile.avatar}
                icon={!adminProfile.avatar && <SafetyCertificateOutlined />}
                className="admin-badge-avatar"
              />
              <div className="admin-badge-meta">
                <span className="admin-badge-name">{adminProfile.name}</span>
                <span className="admin-badge-role">{adminProfile.role}</span>
              </div>
            </div>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="pd-top">
                  <Avatar
                    size={56}
                    src={adminProfile.avatar}
                    icon={!adminProfile.avatar && <SafetyCertificateOutlined />}
                    className="pd-avatar"
                  />
                  <div className="pd-info">
                    <Text className="pd-name">{adminProfile.name}</Text>
                    <span className="pd-role-badge">{adminProfile.role}</span>
                  </div>
                </div>
                <div className="pd-divider" />
                <div className="pd-contact">
                  {adminProfile.email && (
                    <div className="pd-row">
                      <MailOutlined className="pd-icon" />
                      <Text className="pd-text">{adminProfile.email}</Text>
                    </div>
                  )}
                  {adminProfile.phone && (
                    <div className="pd-row">
                      <PhoneOutlined className="pd-icon" />
                      <Text className="pd-text">{adminProfile.phone}</Text>
                    </div>
                  )}
                </div>
                <div className="pd-divider" />
                <button className="pd-edit-btn" onClick={openEdit}>
                  <EditOutlined />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Edit Admin Profile"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={() => form.submit()}
        okText="Save Changes"
        okButtonProps={{ className: 'modal-save-btn' }}
        centered
        width={460}
      >
        <div className="edit-avatar-section">
  <ImageUpload
    value={adminProfile.avatar}
    onChange={(url) => {
      const updated = { ...adminProfile, avatar: url }
      setAdminProfile(updated)
      localStorage.setItem('admin-profile', JSON.stringify(updated))
      window.dispatchEvent(new Event('admin-profile-updated'))
    }}
    folder="pulse_and_peace/admin"
    placeholder="Upload Photo"
  />
</div>
        <Form form={form} layout="vertical" onFinish={handleSave} className="edit-form">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Admin Name" />
          </Form.Item>
          <Form.Item name="role" label="Role Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Super Control" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@pulsepeace.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input prefix={<PhoneOutlined />} placeholder="+92 300 0000000" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default TopBar