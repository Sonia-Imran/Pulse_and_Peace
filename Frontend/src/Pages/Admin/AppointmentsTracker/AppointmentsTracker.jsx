import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Button, message, Empty, Popconfirm } from 'antd'
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import API from '../../../api'
import './AppointmentsTracker.css'

const { Text } = Typography

const AppointmentsTracker = () => {
  const [appointmentsList, setAppointmentsList] = useState([])
  const [counters, setCounters] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data } = await API.get('/admin/appointments')
      const appts = data.data || []
      let pending = 0, completed = 0, revenue = 0
      appts.forEach(apt => {
        revenue += Number(apt.fee || 0)
        const s = (apt.status || '').toLowerCase()
        if (s === 'pending') pending++
        if (s === 'completed' || s === 'accepted') completed++
      })
      setAppointmentsList(appts)
      setCounters({ total: appts.length, pending, completed, revenue })
    } catch {
      message.error('Failed to load appointments')
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.put(`/doctor/appointments/${id}/status`, { status: newStatus })
      message.success(`Appointment marked as ${newStatus}!`)
      loadData()
    } catch {
      message.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/admin/appointments/${id}`)
      message.success('Appointment deleted!')
      loadData()
    } catch {
      message.error('Failed to delete appointment')
    }
  }

  const columns = [
    { title: 'Patient', dataIndex: 'patientName', render: t => <Text className="apt-patient-name">{t}</Text> },
    { title: 'Doctor', dataIndex: 'doctorName', render: t => <Text className="apt-doctor-name">Dr. {t}</Text> },
    {
      title: 'Date & Time',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text className="apt-date"><CalendarOutlined /> {r.date}</Text>
          <Text className="apt-time">{r.time}</Text>
        </Space>
      ),
    },
    { title: 'Type', dataIndex: 'type', render: t => <Tag className="apt-type-tag">{t}</Tag> },
    { title: 'Fee', dataIndex: 'fee', render: f => <Text className="apt-fee">Rs. {f || 0}</Text> },
    {
      title: 'Status', dataIndex: 'status',
      render: status => {
        const s = (status || 'pending').toLowerCase()
        const cls = s === 'completed' ? 'apt-status-green' : s === 'accepted' ? 'apt-status-blue' : s === 'rejected' ? 'apt-status-red' : 'apt-status-orange'
        const label = s === 'completed' ? 'Completed' : s === 'accepted' ? 'Accepted' : s === 'rejected' ? 'Rejected' : 'Pending'
        return <Tag className={`apt-status-tag ${cls}`}>{label.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      render: (_, record) => {
        const s = (record.status || '').toLowerCase()
        return (
          <Space>
            {s !== 'completed' && s !== 'rejected' && (
              <Button className="apt-complete-btn" size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'completed')}>
                Complete
              </Button>
            )}
            <Popconfirm title="Delete this appointment?" okText="Delete" okType="danger" onConfirm={() => handleDelete(record.id)}>
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="apt-wrapper">
      <div className="apt-page-header">
        <div className="apt-page-header-icon">📅</div>
        <div>
          <h2 className="apt-page-title">Appointments Control Log</h2>
          <p className="apt-page-sub">Manage slot allocations, payment parameters, and process cycles</p>
        </div>
      </div>

      <Row gutter={[16, 16]} className="apt-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="apt-stat-card">
            <div className="apt-stat-icon apt-icon-blue"><CalendarOutlined /></div>
            <Statistic title="Total Appointments" value={counters.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="apt-stat-card">
            <div className="apt-stat-icon apt-icon-orange"><ClockCircleOutlined /></div>
            <Statistic title="Pending" value={counters.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="apt-stat-card">
            <div className="apt-stat-icon apt-icon-green"><CheckCircleOutlined /></div>
            <Statistic title="Completed" value={counters.completed} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="apt-stat-card">
            <div className="apt-stat-icon apt-icon-teal"><DollarCircleOutlined /></div>
            <Statistic title="Total Revenue" value={`Rs. ${counters.revenue}`} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="apt-table-card" title={<Text className="apt-card-title">Active Appointments</Text>}>
        <Table
          dataSource={appointmentsList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 6 }}
          size="middle"
          className="apt-table"
          locale={{ emptyText: <Empty description="No appointments found" /> }}
        />
      </Card>
    </div>
  )
}

export default AppointmentsTracker