import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Rate, message } from 'antd'
import { UserOutlined, StarOutlined, CalendarOutlined } from '@ant-design/icons'
import API from '../../../api'
import './DoctorsTracker.css'

const { Text } = Typography

const DoctorsTracker = () => {
  const [doctorsData, setDoctorsData] = useState([])
  const [globalStats, setGlobalStats] = useState({ totalDoctors: 0, avgPlatformRating: '0.0', totalConsultations: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data } = await API.get('/admin/doctors/stats')
      setDoctorsData(data.data || [])
      setGlobalStats(data.stats || { totalDoctors: 0, avgPlatformRating: '0.0', totalConsultations: 0 })
    } catch {
      message.error('Failed to load doctors data')
    }
  }

  const columns = [
    {
      title: 'Doctor',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text className="dt-doctor-name">Dr. {record.name}</Text>
          <Text className="dt-doctor-email">{record.email}</Text>
        </Space>
      ),
    },
    { title: 'Specialty', dataIndex: 'specialty', render: dept => <Tag className="dt-dept-tag">{dept}</Tag> },
    { title: 'Education', dataIndex: 'education', render: edu => <Text className="dt-edu">{edu}</Text> },
    { title: 'Phone', dataIndex: 'phone', render: p => <Text className="dt-phone">{p}</Text> },
    {
      title: 'Rating',
      dataIndex: 'rating',
      render: rating => (
        <Space direction="vertical" size={0}>
          <Rate disabled allowHalf value={rating} className="dt-rate" />
          <Text className="dt-rating-val">{rating > 0 ? `${Number(rating).toFixed(1)} / 5` : 'No reviews yet'}</Text>
        </Space>
      ),
    },
    { title: 'Cases', dataIndex: 'casesCount', render: count => <Tag className="dt-cases-tag">{count} Appointments</Tag> },
  ]

  return (
    <div className="dt-wrapper">
      <div className="dt-page-header">
        <div className="dt-page-header-icon">🩺</div>
        <div>
          <h2 className="dt-page-title">Medical Practitioners Registry</h2>
          <p className="dt-page-sub">Monitor operational metrics, ratings, and caseload allocations</p>
        </div>
      </div>

      <Row gutter={[16, 16]} className="dt-stats-row">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="dt-stat-card">
            <div className="dt-stat-icon dt-icon-teal"><UserOutlined /></div>
            <Statistic title="Total Doctors" value={globalStats.totalDoctors} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="dt-stat-card">
            <div className="dt-stat-icon dt-icon-green"><StarOutlined /></div>
            <Statistic title="Platform Avg Rating" value={`${globalStats.avgPlatformRating} / 5.0`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="dt-stat-card">
            <div className="dt-stat-icon dt-icon-blue"><CalendarOutlined /></div>
            <Statistic title="Total Appointments" value={globalStats.totalConsultations} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="dt-table-card" title={<Text className="dt-card-title">Doctor Performance Tracker</Text>}>
        <Table dataSource={doctorsData} columns={columns} rowKey="key" pagination={{ pageSize: 6 }} size="middle" className="dt-table" />
      </Card>
    </div>
  )
}

export default DoctorsTracker