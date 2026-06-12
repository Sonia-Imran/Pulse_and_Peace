import { useState, useEffect } from 'react'
import { Row, Col, Avatar, Table, Tag, Switch, message, Popconfirm } from 'antd'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  CalendarOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ArrowUpOutlined, MedicineBoxOutlined, BankOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import API from '../../../api'
import './DoctorDashboard.css'

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const [isAvailable, setIsAvailable]         = useState(true)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [chartData, setChartData]             = useState([])
  const [stats, setStats]                     = useState({
    todayAppointments: 0, totalPatients: 0, completedToday: 0,
    pendingRequests: 0, totalEarnings: 0, doctorShare: 0,
  })

  useEffect(() => {
    loadData()
    window.addEventListener('new-appointment', loadData)
    return () => window.removeEventListener('new-appointment', loadData)
  }, [])

const loadData = async () => {
  try {
    const token = localStorage.getItem('doctor-token')
    if (token) {
      const [apptRes, earningsRes] = await Promise.all([
        API.get('/doctor/appointments'),
        API.get('/doctor/earnings'),
      ])

      const appts = apptRes.data.data || []
      const earnStats = earningsRes.data.stats || {}
      const today = new Date().toISOString().split('T')[0]

      const counts = { accepted: 0, pending: 0, completed: 0, rejected: 0 }
      appts.forEach(a => { if (a.status in counts) counts[a.status]++ })

      setChartData([
        { name: `Accepted (${counts.accepted})`,   value: counts.accepted,  color: '#1d9e75' },
        { name: `Pending (${counts.pending})`,     value: counts.pending,   color: '#faad14' },
        { name: `Completed (${counts.completed})`, value: counts.completed, color: '#52c41a' },
        { name: `Rejected (${counts.rejected})`,   value: counts.rejected,  color: '#ff4d4f' },
      ])

      setRecentAppointments(appts.slice(0, 5).map((a, i) => ({
        ...a,
        key: a.id || i.toString(),
      })))

      setStats({
        todayAppointments: appts.filter(a => a.date === today).length,
        totalPatients:     [...new Set(appts.map(a => a.patientId || a.patient))].length,
        completedToday:    appts.filter(a => a.status === 'completed' && a.date === today).length,
        pendingRequests:   appts.filter(a => a.status === 'pending').length,
        totalEarnings:     earnStats.totalRevenue  || 0,
        doctorShare:       earnStats.doctorShare   || 0,
      })
    } else {
      // localStorage fallback
      const appointments = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
      const payments     = JSON.parse(localStorage.getItem('localPayments')   || '[]')
      const users        = JSON.parse(localStorage.getItem('localUsers')      || '[]')
      const patientProf  = JSON.parse(localStorage.getItem('patient_profile') || '{}')
      const today        = new Date().toISOString().split('T')[0]

      const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
      const counts = { accepted: 0, pending: 0, completed: 0, rejected: 0 }
      appointments.forEach(a => { if (a.status in counts) counts[a.status]++ })

      setChartData([
        { name: `Accepted (${counts.accepted})`,   value: counts.accepted,  color: '#1d9e75' },
        { name: `Pending (${counts.pending})`,     value: counts.pending,   color: '#faad14' },
        { name: `Completed (${counts.completed})`, value: counts.completed, color: '#52c41a' },
        { name: `Rejected (${counts.rejected})`,   value: counts.rejected,  color: '#ff4d4f' },
      ])

      setRecentAppointments(
        appointments.slice().reverse().slice(0, 5).map((a, i) => {
          const user = users.find(u => u._id === a.patientId)
          return {
            ...a,
            key:     a.id || i.toString(),
            patient: user?.fullName || patientProf?.fullName || a.patient || 'Patient',
          }
        })
      )

      setStats({
        todayAppointments: appointments.filter(a => a.date === today).length,
        totalPatients:     [...new Set(appointments.map(a => a.patientId || a.patient))].length,
        completedToday:    appointments.filter(a => a.status === 'completed' && a.date === today).length,
        pendingRequests:   appointments.filter(a => a.status === 'pending').length,
        totalEarnings:     totalRevenue,
        doctorShare:       Math.round(totalRevenue * 0.9),
      })
    }
  } catch (err) {
    console.error('Dashboard load error:', err)
    message.error('Failed to load dashboard data')
  }
}

  const handleDelete = (id) => {
    const data    = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
    const updated = data.filter(a => a.id !== id)
    localStorage.setItem('pp_appointments', JSON.stringify(updated))
    message.success('Appointment deleted!')
    loadData()
    window.dispatchEvent(new Event('new-appointment'))
  }

  const handleAvailability = (checked) => {
    setIsAvailable(checked)
    message.success(checked ? 'You are now Available.' : 'You are now Offline.')
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const statsCards = [
    { title: "Today's Appointments", value: stats.todayAppointments, icon: <CalendarOutlined />, change: `${stats.pendingRequests} pending`,                             color: 'teal'   },
    { title: 'Total Patients',        value: stats.totalPatients,     icon: <UserOutlined />,    change: 'Unique patients',                                               color: 'blue'   },
    { title: 'Completed Today',       value: stats.completedToday,    icon: <CheckCircleOutlined />, change: `${stats.todayAppointments - stats.completedToday} remaining`, color: 'green'  },
    { title: 'Pending Requests',      value: stats.pendingRequests,   icon: <ClockCircleOutlined />, change: 'Needs attention',                                           color: 'orange' },
  ]

  const columns = [
    {
      title: 'Patient', dataIndex: 'patient',
      render: (name, record) => (
        <div className="patient-cell">
          <Avatar size={32} className="patient-avatar">{(name || 'P')[0].toUpperCase()}</Avatar>
          <div>
            <span className="patient-name">{name}</span>
            {record.phone && <span className="patient-phone">{record.phone}</span>}
          </div>
        </div>
      ),
    },
    { title: 'Date',   dataIndex: 'date',   render: d => <span className="table-text">{d}</span> },
    { title: 'Time',   dataIndex: 'time',   render: t => <span className="table-time">{t}</span> },
    { title: 'Type',   dataIndex: 'type',   render: t => <span className="table-type">{t}</span> },
    {
      title: 'Status', dataIndex: 'status',
      render: s => <Tag className={`status-tag status-${s}`}>{s?.charAt(0).toUpperCase() + s?.slice(1)}</Tag>,
    },
    {
      title: 'Action',
      render: (_, record) => (
        <Popconfirm title="Delete this appointment?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
          <button className="delete-appt-btn"><DeleteOutlined /></button>
        </Popconfirm>
      ),
    },
  ]

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <div className="welcome-left">
          <h2 className="welcome-title">{getGreeting()}, {'Doctor'} 👋</h2>
          <p className="welcome-sub">Here's what's happening with your patients today.</p>
        </div>
        <div className="welcome-right">
          <div className="today-badge">
            <CalendarOutlined />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <Row gutter={[20, 20]} className="stats-row">
        {statsCards.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <div className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon-wrap">{stat.icon}</div>
              <div className="stat-info">
                <span className="stat-title">{stat.title}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-change"><ArrowUpOutlined /> {stat.change}</span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]} className="earnings-row">
        <Col xs={24} sm={12}>
          <div className="earnings-card earnings-total">
            <div className="earnings-icon-wrap"><BankOutlined /></div>
            <div className="earnings-info">
              <span className="earnings-label">Total Platform Revenue</span>
              <span className="earnings-value">Rs. {stats.totalEarnings?.toLocaleString()}</span>
              <span className="earnings-sub">All paid consultations</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="earnings-card earnings-mine">
            <div className="earnings-icon-wrap"><MedicineBoxOutlined /></div>
            <div className="earnings-info">
              <span className="earnings-label">My Earnings (90%)</span>
              <span className="earnings-value earnings-highlight">Rs. {stats.doctorShare?.toLocaleString()}</span>
              <span className="earnings-sub">After platform fee deduction</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="dashboard-middle">
        <Col xs={24} lg={16}>
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Recent Appointments</h3>
              <span className="card-link" onClick={() => navigate('/doctor/appointments')}>View All</span>
            </div>
            <Table columns={columns} dataSource={recentAppointments} rowKey="key" pagination={false} className="appointments-table" locale={{ emptyText: 'No appointments yet' }} />
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="dashboard-card">
            <div className="card-header"><h3 className="card-title">Appointment Status</h3></div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.filter(d => d.value > 0)} innerRadius={50} outerRadius={75} dataKey="value" labelLine={false} label={renderCustomLabel}>
                    {chartData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {chartData.map((item, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-text">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card availability-card">
            <div className="card-header"><h3 className="card-title">My Status</h3></div>
            <div className="availability-content">
              <div className="avail-row">
                <div className="avail-info">
                  <span className={`avail-dot ${isAvailable ? 'active' : 'offline'}`} />
                  <span className="avail-text">{isAvailable ? 'Currently Available' : 'Offline / Busy'}</span>
                </div>
                <Switch checked={isAvailable} onChange={handleAvailability} />
              </div>
              <p className="avail-desc">
                {isAvailable ? 'Patients can book and send consultation requests.' : 'Booking is paused. Turn on to receive requests.'}
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default DoctorDashboard