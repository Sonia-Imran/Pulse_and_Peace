import { useState, useEffect } from 'react'
import {
  Table, Tag, Button, Input, Modal, Space, Card, Row, Col,
  Avatar, Typography, Badge, Tooltip, Statistic, Popconfirm, notification, message,
} from 'antd'
import {
  CheckOutlined, CloseOutlined, SearchOutlined, CalendarOutlined,
  UserOutlined, ClockCircleOutlined, CheckCircleOutlined, MessageOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import API from '../../../api'
import './DoctorAppointments.css'
const { Title} = Typography
const { Text } = Typography

const STATUS_CONFIG = {
  pending:   { color: 'gold',   label: 'Pending'   },
  accepted:  { color: 'blue',   label: 'Approved'  },
  completed: { color: 'green',  label: 'Completed' },
  ongoing:   { color: 'purple', label: 'Ongoing'   },
  rejected:  { color: 'red',    label: 'Rejected'  },
}

const FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'pending',   label: 'Pending'   },
  { key: 'accepted',  label: 'Approved'  },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected',  label: 'Rejected'  },
]

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    loadAppointments()
    window.addEventListener('new-appointment', loadAppointments)
    return () => window.removeEventListener('new-appointment', loadAppointments)
  }, [])
const loadAppointments = async () => {
  try {
    const token = localStorage.getItem('doctor-token')
    if (token) {
      const { data } = await API.get('/doctor/appointments')
      setAppointments(data.data || [])
    } else {
      const data        = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
      const users       = JSON.parse(localStorage.getItem('localUsers')      || '[]')
      const patientProf = JSON.parse(localStorage.getItem('patient_profile') || '{}')
      const mapped = data.map((a, i) => {
        const user = users.find(u => u._id === a.patientId)
        return {
          ...a,
          id:      a.id || i.toString(),
          patient: user?.fullName || patientProf?.fullName || a.patient || 'Patient',
        }
      }).reverse()
      setAppointments(mapped)
    }
  } catch (err) {
    console.error('Load appointments error:', err.response?.data)
    message.error('Failed to load appointments')
  }
}

  const showNotif = (msg, type = 'success') =>
    api[type]({ message: msg, placement: 'bottomRight', duration: 3 })

const updateStatus = async (id, status) => {
  try {
    await API.put(`/doctor/appointments/${id}/status`, { status })
    showNotif(
      status === 'accepted' ? 'Appointment approved!' : 'Appointment rejected.',
      status === 'accepted' ? 'success' : 'error'
    )
    setDetailOpen(false)
    loadAppointments()
  } catch {
    message.error('Failed to update status')
  }
}
const handleDelete = async (id, e) => {
  e?.stopPropagation()
  try {
    await API.put(`/doctor/appointments/${id}/status`, { status: 'rejected' })
  } catch {}
  setDetailOpen(false)
  loadAppointments()
}

  const openDetail = (record) => { setDetailRecord(record); setDetailOpen(true) }

  const filtered = appointments.filter(a => {
    const matchFilter = activeFilter === 'all' || a.status === activeFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (a.patient || '').toLowerCase().includes(q) ||
      (a.type    || '').toLowerCase().includes(q) ||
      (a.date    || '').includes(q)
    return matchFilter && matchSearch
  })

  const counts = {
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    accepted:  appointments.filter(a => a.status === 'accepted').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  }

  const columns = [
    {
      title: 'Patient',
      dataIndex: 'patient',
      render: (name, record) => (
        <Space>
          <Avatar className="patient-avatar">{(name || 'P')[0].toUpperCase()}</Avatar>
          <div>
            <div className="patient-name">{name || 'N/A'}</div>
            <div className="patient-phone">{record.phone || 'N/A'}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Date',    dataIndex: 'date',   render: d => <Text className="cell-muted">{d || 'N/A'}</Text> },
    { title: 'Time',    dataIndex: 'time',   render: t => <Text className="cell-muted">{t || 'N/A'}</Text> },
    { title: 'Type',    dataIndex: 'type',   render: t => <span className="type-chip">{t || 'N/A'}</span> },
    {
      title: 'Payment',
      render: (_, record) => {
        const isPaid = record.paymentStatus === 'paid'
        return <Tag color={isPaid ? 'green' : 'orange'} className="pay-tag">{isPaid ? '✓ Paid' : 'Unpaid'}</Tag>
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: status => (
        <Tag color={STATUS_CONFIG[status]?.color || 'default'} className="status-tag">
          {STATUS_CONFIG[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space onClick={e => e.stopPropagation()}>
          {record.status === 'pending' && (
            <>
              <Popconfirm title="Approve?" okText="Approve" cancelText="Cancel" okButtonProps={{ className: 'popconfirm-approve-btn' }} onConfirm={() => updateStatus(record.id, 'accepted')}>
                <Tooltip title="Approve">
                  <Button className="action-btn-approve" icon={<CheckOutlined />} size="small" />
                </Tooltip>
              </Popconfirm>
              <Popconfirm title="Reject?" okText="Reject" okType="danger" cancelText="Cancel" onConfirm={() => updateStatus(record.id, 'rejected')}>
                <Tooltip title="Reject">
                  <Button className="action-btn-reject" icon={<CloseOutlined />} size="small" danger />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          {record.status === 'accepted' && record.paymentStatus === 'paid' && (
            <Tooltip title="Open Chat">
              <Button className="action-btn-chat" icon={<MessageOutlined />} size="small"
                onClick={() => navigate(`/doctor/consultation/${record.id}`)} />
            </Tooltip>
          )}
          <Popconfirm title="Delete?" okText="Delete" okType="danger" cancelText="Cancel" onConfirm={e => handleDelete(record.id, e)}>
            <Tooltip title="Delete">
              <Button className="action-btn-delete" icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="appt-page">
      {contextHolder}

      <div className="appt-page-header">
        <div>
          <Title level={4} className="appt-page-title">Appointments</Title>
          <Text className="appt-page-sub">Manage all appointments — approve, reject, and track patient requests</Text>
        </div>
      </div>

      <Row gutter={16} className="stats-row">
        <Col span={6}><Card className="stat-card stat-card--total"><Statistic title="Total" value={counts.total} prefix={<CalendarOutlined className="stat-icon-total" />} /></Card></Col>
        <Col span={6}><Card className="stat-card stat-card--pending"><Statistic title="Pending" value={counts.pending} prefix={<ClockCircleOutlined className="stat-icon-pending" />} /></Card></Col>
        <Col span={6}><Card className="stat-card stat-card--approved"><Statistic title="Accepted" value={counts.accepted} prefix={<CheckCircleOutlined className="stat-icon-approved" />} /></Card></Col>
        <Col span={6}><Card className="stat-card stat-card--completed"><Statistic title="Completed" value={counts.completed} prefix={<UserOutlined className="stat-icon-completed" />} /></Card></Col>
      </Row>

      <div className="appt-toolbar">
        <Space className="filter-chips" wrap>
          {FILTERS.map(f => (
            <Badge key={f.key} count={f.key !== 'all' ? appointments.filter(a => a.status === f.key).length : 0} size="small" className="filter-badge">
              <button className={`filter-chip ${activeFilter === f.key ? 'filter-chip--active' : ''}`} onClick={() => setActiveFilter(f.key)}>
                {f.label}
              </button>
            </Badge>
          ))}
        </Space>
        <Input className="appt-search" placeholder="Search by patient, type or date..." prefix={<SearchOutlined className="search-prefix-icon" />} value={search} onChange={e => setSearch(e.target.value)} allowClear />
      </div>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          rowClassName="table-row"
          onRow={record => ({ onClick: () => openDetail(record) })}
          pagination={{ pageSize: 8, showTotal: total => `Showing ${total} appointments` }}
          locale={{ emptyText: 'No appointments found.' }}
        />
      </Card>

      <Modal
        title="Appointment Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={
          <Space>
            {detailRecord?.status === 'pending' && (
              <>
                <Popconfirm title="Reject?" okText="Reject" okType="danger" onConfirm={() => updateStatus(detailRecord.id, 'rejected')}>
                  <Button danger>Reject</Button>
                </Popconfirm>
                <Popconfirm title="Approve?" okText="Approve" okButtonProps={{ className: 'popconfirm-approve-btn' }} onConfirm={() => updateStatus(detailRecord.id, 'accepted')}>
                  <Button type="primary" className="btn-submit">Approve</Button>
                </Popconfirm>
              </>
            )}
            {detailRecord?.status === 'accepted' && detailRecord?.paymentStatus === 'paid' && (
              <Button type="primary" className="btn-submit" onClick={() => { setDetailOpen(false); navigate(`/doctor/consultation/${detailRecord.id}`) }}>
                Open Chat
              </Button>
            )}
            <Popconfirm title="Delete?" okText="Delete" okType="danger" onConfirm={() => handleDelete(detailRecord?.id)}>
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </Space>
        }
        className="appt-modal"
        centered
      >
        {detailRecord && (
          <div className="detail-body">
            <div className="detail-patient-row">
              <Avatar className="patient-avatar detail-avatar">{(detailRecord.patient || 'P').charAt(0).toUpperCase()}</Avatar>
              <div className="detail-patient-info">
                <div className="patient-name">{detailRecord.patient}</div>
                <div className="patient-phone">{detailRecord.phone || 'N/A'}</div>
              </div>
              <Tag color={STATUS_CONFIG[detailRecord.status]?.color || 'default'} className="status-tag">
                {STATUS_CONFIG[detailRecord.status]?.label || detailRecord.status}
              </Tag>
            </div>
            <Row gutter={[16, 12]} className="detail-grid">
              <Col span={12}><div className="detail-label">Date</div><div className="detail-value">{detailRecord.date || 'N/A'}</div></Col>
              <Col span={12}><div className="detail-label">Time</div><div className="detail-value">{detailRecord.time || 'N/A'}</div></Col>
              <Col span={12}><div className="detail-label">Service</div><div className="detail-value">{detailRecord.type || 'N/A'}</div></Col>
              <Col span={12}><div className="detail-label">Consult Type</div><div className="detail-value">{detailRecord.consultType || 'N/A'}</div></Col>
              <Col span={12}>
                <div className="detail-label">Payment</div>
                <div className="detail-value">
                  <Tag color={detailRecord.paymentStatus === 'paid' ? 'green' : 'orange'}>
                    {detailRecord.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}
                  </Tag>
                </div>
              </Col>
              <Col span={24}><div className="detail-label">Reason</div><div className="detail-value">{detailRecord.reason || 'N/A'}</div></Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}