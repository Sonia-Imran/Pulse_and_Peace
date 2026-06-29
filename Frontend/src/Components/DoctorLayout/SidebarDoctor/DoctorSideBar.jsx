import { useState, useEffect } from 'react'
import { Menu, Avatar, Typography, Modal, Form, Input, Select, message } from 'antd'
import {
  DashboardOutlined, CalendarOutlined, UserOutlined, MessageOutlined,
  FileTextOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  ExclamationCircleOutlined, EditOutlined, CameraOutlined, HeartOutlined, BankFilled,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { ListCheckIcon } from 'lucide-react'
import API from '../../../api'
import ImageUpload from '../../ImageUpload/ImageUpload'
import './SideBard.css'

const { Text } = Typography
const { Option } = Select

const SideBar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profileModal, setProfileModal] = useState(false)
  const [doctor, setDoctor] = useState({
    fullName: '', specialty: '', email: '', phone: '',
    education: '', description: '', avatarUrl: null,
  })
  const [form] = Form.useForm()

  useEffect(() => {
    loadDoctor()
    window.addEventListener('doctor-profile-updated', loadDoctor)
    return () => window.removeEventListener('doctor-profile-updated', loadDoctor)
  }, [])

  const loadDoctor = async () => {
    try {
      const { data } = await API.get('/doctor/profile')
      const d = data.data
      setDoctor({
        fullName:    d.fullName    || '',
        specialty:   d.specialty   || '',
        email:       d.email       || '',
        phone:       d.phone       || '',
        education:   d.education   || '',
        description: d.description || '',
        avatarUrl:   d.avatarUrl   || null,
      })
      localStorage.setItem('doctor_profile', JSON.stringify(d))
    } catch {
      const saved = JSON.parse(localStorage.getItem('doctor_profile') || '{}')
      if (saved.fullName) setDoctor(saved)
    }
  }

  const menuItems = [
    { key: '/doctor/dashboard',          icon: <DashboardOutlined />, label: 'Dashboard'       },
    { key: '/doctor/appointments',       icon: <CalendarOutlined />,  label: 'Appointments'    },
    { key: '/doctor/patients',           icon: <UserOutlined />,      label: 'My Patients'     },
    { key: '/doctor/text-consultations', icon: <MessageOutlined />,   label: 'Consultations'   },
    { key: '/doctor/records',            icon: <FileTextOutlined />,  label: 'Patient Records' },
    { key: '/doctor/services',           icon: <ListCheckIcon />,     label: 'Doctor Services' },
    { key: '/doctor/DoctorEarnings',     icon: <BankFilled />,        label: 'Doctor Earnings' },
  ]

  const handleLogout = () => {
    Modal.confirm({
      title:      'Confirm Logout',
      icon:       <ExclamationCircleOutlined />,
      content:    'Are you sure you want to exit the session?',
      okText:     'Logout',
      okType:     'danger',
      centered:   true,
      onOk() {
        localStorage.removeItem('doctor-token')
        localStorage.removeItem('doctor_profile')
        localStorage.removeItem('user-token')
        localStorage.removeItem('patient_profile')
        localStorage.removeItem('admin-token')
        window.location.href = '/login'
      },
    })
  }

  const handleProfileSave = async (values) => {
    try {
      await API.put('/doctor/profile', { ...values, avatarUrl: doctor.avatarUrl })
      setDoctor(prev => ({ ...prev, ...values }))
      window.dispatchEvent(new Event('doctor-profile-updated'))
      message.success('Profile updated successfully!')
      setProfileModal(false)
    } catch {
      message.error('Failed to update profile')
    }
  }

  const openModal = () => {
    form.setFieldsValue({
      fullName:    doctor.fullName,
      specialty:   doctor.specialty,
      email:       doctor.email,
      phone:       doctor.phone,
      education:   doctor.education,
      description: doctor.description,
    })
    setProfileModal(true)
  }

  return (
    <>
      <div className={`doctor-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon"><HeartOutlined /></div>
            {!collapsed && <span className="logo-text">Pulse & Peace</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        <div className="sidebar-doctor-info">
          <div className="avatar-wrapper">
            <Avatar
              size={collapsed ? 38 : 56}
              src={doctor.avatarUrl}
              icon={!doctor.avatarUrl && <UserOutlined />}
              className="doctor-avatar"
            />
            {!collapsed && (
              <button className="edit-avatar-btn" onClick={openModal}>
                <CameraOutlined />
              </button>
            )}
          </div>
          {!collapsed && (
            <div className="doctor-details">
              <div className="doctor-name-row">
                <Text className="doctor-name">
                  {doctor.fullName ? `Dr. ${doctor.fullName}` : 'Doctor'}
                </Text>
                <button className="edit-profile-btn" onClick={openModal}>
                  <EditOutlined />
                </button>
              </div>
              <div className="doctor-badge">
                <span className="spec-dot" />
                <Text className="doctor-spec">{doctor.specialty || 'Specialist'}</Text>
              </div>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          inlineCollapsed={collapsed}
          className="sidebar-menu"
        />

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutOutlined />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <Modal
        title="Update Profile"
        open={profileModal}
        onCancel={() => setProfileModal(false)}
        onOk={() => form.submit()}
        okText="Save Changes"
        width={480}
        destroyOnClose
      >
        <div className="modal-avatar-section">
          <ImageUpload
            value={doctor.avatarUrl}
            onChange={async (url) => {
              try {
                await API.put('/doctor/profile', { ...doctor, avatarUrl: url })
                setDoctor(prev => ({ ...prev, avatarUrl: url }))
                window.dispatchEvent(new Event('doctor-profile-updated'))
                message.success('Photo updated!')
              } catch {
                message.error('Failed to update photo')
              }
            }}
            folder="pulse_and_peace/doctors"
            placeholder="Upload Photo"
          />
        </div>
        <Form form={form} layout="vertical" onFinish={handleProfileSave} className="profile-form">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="specialty" label="Specialization" rules={[{ required: true }]}>
            <Select>
              <Option value="Cardiologist">Cardiologist</Option>
              <Option value="General Physician">General Physician</Option>
              <Option value="Dermatologist">Dermatologist</Option>
              <Option value="Neurologist">Neurologist</Option>
              <Option value="Orthopedic">Orthopedic</Option>
            </Select>
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="education" label="Education">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default SideBar