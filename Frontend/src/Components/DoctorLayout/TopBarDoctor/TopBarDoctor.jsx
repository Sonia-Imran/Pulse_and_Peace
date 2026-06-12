import React, { useState, useEffect } from 'react'
import { Badge, Avatar, Typography, Popover } from 'antd'
import { BellOutlined, UserOutlined } from '@ant-design/icons'
import API from '../../../api'
import './TopBarDoctor.css'

const { Text } = Typography

const TopBarDoctor = ({ collapsed }) => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [doctor, setDoctor] = useState({ fullName: '', specialty: '', avatarUrl: null })
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    loadDoctor()
    loadNotifications()
    window.addEventListener('doctor-profile-updated', loadDoctor)
    return () => window.removeEventListener('doctor-profile-updated', loadDoctor)
  }, [])

  const loadDoctor = async () => {
    try {
      const { data } = await API.get('/doctor/profile')
      const d = data.data
      setDoctor({ fullName: d.fullName || '', specialty: d.specialty || '', avatarUrl: d.avatarUrl || null })
    } catch {
      const saved = JSON.parse(localStorage.getItem('doctor_profile') || '{}')
      if (saved.fullName) setDoctor({ fullName: saved.fullName, specialty: saved.specialty || '', avatarUrl: saved.avatarUrl || null })
    }
  }

  const loadNotifications = async () => {
    try {
      const { data } = await API.get('/notifications')
      setNotifications(data.data || [])
    } catch {
      setNotifications([])
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotiClick = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    } catch {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const notificationMenu = (
    <div className="notif-dropdown-panel">
      <div className="notif-header">
        <span className="notif-title">Notifications</span>
        {unreadCount > 0 && (
          <span className="notif-count" onClick={handleMarkAllRead}>Mark all read</span>
        )}
      </div>
      <div className="notif-list-container">
        {notifications.length === 0 ? (
          <div className="notif-empty">No notifications yet</div>
        ) : (
          notifications.slice(0, 8).map(item => (
            <div
              key={item._id}
              className={`notif-item ${!item.read ? 'unread' : ''}`}
              onClick={() => handleNotiClick(item._id)}
            >
              <div className="notif-dot-wrapper">
                {!item.read && <span className="notif-dot" />}
              </div>
              <div className="notif-content">
                <p className="notif-text">{item.message}</p>
                <span className="notif-time">{item.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="notif-view-all" onClick={() => setPopoverOpen(false)}>
        Close Panel
      </div>
    </div>
  )

  return (
    <div className={`doctor-topbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="topbar-right">
        <div className="topbar-date">
          <span className="date-day">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          <span className="date-full">
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <Popover
          content={notificationMenu}
          trigger="click"
          placement="bottomRight"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          arrow={{ pointAtCenter: true }}
          overlayClassName="notif-popover-override"
        >
          <button className="topbar-icon-btn">
            <Badge count={unreadCount} size="small">
              <BellOutlined className="topbar-icon" />
            </Badge>
          </button>
        </Popover>

        <div className="topbar-divider" />

        <div className="topbar-profile">
          <Avatar
            size={36}
            src={doctor.avatarUrl}
            icon={!doctor.avatarUrl && <UserOutlined />}
            className="topbar-avatar"
          />
          <div className="topbar-profile-info">
            <Text className="topbar-name">
              {doctor.fullName ? `Dr. ${doctor.fullName}` : 'Doctor'}
            </Text>
            <Text className="topbar-role">{doctor.specialty || 'Specialist'}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBarDoctor