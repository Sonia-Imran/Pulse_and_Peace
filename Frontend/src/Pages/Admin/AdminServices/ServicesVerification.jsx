import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Button, message, Popconfirm, Image } from 'antd'
import { AppstoreOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DollarCircleOutlined } from '@ant-design/icons'
import API from '../../../api'
import './ServicesVerification.css'

const { Title, Text } = Typography

const ServicesVerification = () => {
  const [servicesList, setServicesList] = useState([])
  const [counters, setCounters] = useState({ total: 0, pending: 0, approved: 0, totalRevenue: 0 })

  useEffect(() => { loadServices() }, [])

  const loadServices = async () => {
    try {
      const { data } = await API.get('/admin/services')
      const services = data.data || []
      let pending = 0, approved = 0, revenue = 0
      services.forEach((s) => {
        const st = (s.status || '').toLowerCase()
        if (st === 'pending') pending++
        if (st === 'approved') { approved++; revenue += Number(s.baseFee || 0) }
      })
      setServicesList(services)
      setCounters({ total: services.length, pending, approved, totalRevenue: revenue })
    } catch {
      message.error('Failed to load services')
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.put(`/admin/services/${id}/status`, { status: newStatus })
      message.success(newStatus === 'Approved' ? 'Service approved!' : 'Service rejected.')
      loadServices()
    } catch {
      message.error('Failed to update status')
    }
  }

  const columns = [
    {
      title: 'Banner', dataIndex: 'image', key: 'image', width: 90,
      render: (img, r) => (
        <Image src={img || 'https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80'}
          alt={r.serviceName} width={55} height={38} className="service-thumb"
          fallback="https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80" />
      ),
    },
    { title: 'Service Name', dataIndex: 'serviceName', key: 'serviceName', render: (t) => <b className="service-name-text">{t || 'Untitled'}</b> },
    { title: 'Doctor', dataIndex: 'providerName', key: 'providerName', render: (t) => <span className="doctor-name-text">Dr. {t || '—'}</span> },
    { title: 'Fee', dataIndex: 'baseFee', key: 'baseFee', render: (f) => <Text strong className="fee-text">Rs. {f || 0}</Text> },
    {
      title: 'Payment Auth', key: 'paymentAuth',
      render: (_, r) => {
        const map = { approved: ['Authorized', 'cyan'], rejected: ['Void', 'red'], pending: ['Awaiting', 'orange'] }
        const [label, color] = map[(r.status || 'pending').toLowerCase()] || map.pending
        return <Tag color={color} className="pay-auth-tag">{label.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => {
        const map = { approved: 'green', rejected: 'red', pending: 'gold' }
        return <Tag color={map[(s || 'pending').toLowerCase()] || 'gold'} className="status-tag">{(s || 'Pending').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, r) => (r.status || 'pending').toLowerCase() === 'pending' ? (
        <Space>
          <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="approve-btn" onClick={() => handleUpdateStatus(r._id, 'Approved')}>Approve</Button>
          <Popconfirm title="Reject this service?" onConfirm={() => handleUpdateStatus(r._id, 'Rejected')} okText="Reject" cancelText="Cancel" okButtonProps={{ danger: true }}>
            <Button type="primary" danger size="small" icon={<CloseCircleOutlined />}>Reject</Button>
          </Popconfirm>
        </Space>
      ) : <Text type="secondary" className="locked-text">Locked</Text>,
    },
  ]

  return (
    <div className="services-page-wrapper">
      <header className="services-main-header">
        <div>
          <Title level={3} className="services-title"><AppstoreOutlined /> Services Verification</Title>
          <Text type="secondary">Review and approve doctor service submissions</Text>
        </div>
      </header>

      <Row gutter={[16, 16]} className="services-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="service-stat-card">
            <Statistic title="Total Submissions" value={counters.total} prefix={<AppstoreOutlined className="stat-icon-blue" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="service-stat-card">
            <Statistic title="Awaiting Approval" value={counters.pending} prefix={<ClockCircleOutlined className="stat-icon-yellow" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="service-stat-card">
            <Statistic title="Approved Services" value={counters.approved} prefix={<CheckCircleOutlined className="stat-icon-green" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="service-stat-card">
            <Statistic title="Approved Revenue" value={`Rs. ${counters.totalRevenue}`} prefix={<DollarCircleOutlined className="stat-icon-teal" />} />
          </Card>
        </Col>
      </Row>

      <Card title="Service Verification Pipeline" bordered={false} className="services-table-card">
        <Table dataSource={servicesList} columns={columns} rowKey="_id" pagination={{ pageSize: 5 }} size="middle" />
      </Card>
    </div>
  )
}

export default ServicesVerification