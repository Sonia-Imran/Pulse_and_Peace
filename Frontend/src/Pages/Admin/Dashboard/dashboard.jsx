import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag, Button, Popconfirm, message, Modal, Form, Input, Select, Rate } from 'antd'
import { UserOutlined, TeamOutlined, DeleteOutlined, PlusOutlined, CalendarOutlined, DollarCircleOutlined } from '@ant-design/icons'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import API from '../../../api'
import './dashboard.css'

const { Title, Text } = Typography
const { Option } = Select

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalProfit: 0, doctors: 0, patients: 0, appointments: 0 })
  const [combinedUsers, setCombinedUsers] = useState([])
  const [chartData, setChartData] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
      ])
      const s = statsRes.data.data
      setStats(s)
      const users = usersRes.data.data
      setCombinedUsers(users)
      const doctors = users.filter(u => u.role === 'doctor').length
      const patients = users.filter(u => u.role === 'patient').length
      setChartData([
        { name: 'Doctors', value: doctors || 0 },
        { name: 'Patients', value: patients || 0 },
      ])
    } catch {
      message.error('Failed to load data!')
    }
  }

  const handleAddDoctor = async (values) => {
    setLoading(true)
    try {
      await API.post('/admin/doctors', values)
      message.success(`Dr. ${values.fullName} added successfully!`)
      setIsModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || 'Error adding doctor.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (record) => {
    try {
      await API.delete(`/admin/users/${record._id}`)
      message.success('User removed successfully.')
      loadData()
    } catch {
      message.error('Failed to delete user.')
    }
  }

  const COLORS = ['#1d9e75', '#085041']

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      render: (text, record) => (
        <Text className="ad-user-name">
          {record.role === 'doctor' ? `Dr. ${text}` : text}
        </Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: t => <Text className="ad-user-email">{t}</Text>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: role => (
        <Tag className={`ad-role-tag ad-role-${role}`}>
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      render: (_, record) => record.role !== 'admin' && (
        <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteUser(record)}>
          <Button className="ad-delete-btn" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className="ad-wrapper">
      <div className="ad-welcome-banner">
        <div>
          <Title level={3} className="ad-welcome-title">Welcome back, Admin 👋</Title>
          <Text className="ad-welcome-sub">Here's what's happening on your platform today.</Text>
        </div>
        <Button className="ad-add-btn" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add New Doctor
        </Button>
      </div>

      <Row gutter={[16, 16]} className="ad-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="ad-stat-card ad-stat-teal">
            <div className="ad-stat-icon-wrap ad-icon-teal"><DollarCircleOutlined /></div>
            <Statistic title="Total Profit (10%)" value={`Rs. ${stats.totalProfit}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="ad-stat-card ad-stat-green">
            <div className="ad-stat-icon-wrap ad-icon-green"><UserOutlined /></div>
            <Statistic title="Doctors" value={stats.doctors} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="ad-stat-card ad-stat-blue">
            <div className="ad-stat-icon-wrap ad-icon-blue"><TeamOutlined /></div>
            <Statistic title="Patients" value={stats.patients} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="ad-stat-card ad-stat-orange">
            <div className="ad-stat-icon-wrap ad-icon-orange"><CalendarOutlined /></div>
            <Statistic title="Appointments" value={stats.appointments} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="ad-bottom-row">
        <Col xs={24} lg={14}>
          <Card className="ad-table-card" title={<Text className="ad-card-title">All Registered Users</Text>}>
            <Table
              dataSource={combinedUsers}
              columns={userColumns}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              size="middle"
              className="ad-table"
              locale={{ emptyText: 'No users found' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="ad-chart-card" title={<Text className="ad-card-title">User Distribution</Text>}>
            <div className="ad-chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Add New Doctor"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        className="ad-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleAddDoctor}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialty" label="Specialty" rules={[{ required: true }]}>
            <Select>
              <Option value="Cardiologist">Cardiologist</Option>
              <Option value="General Physician">General Physician</Option>
              <Option value="Dermatologist">Dermatologist</Option>
              <Option value="Neurologist">Neurologist</Option>
              <Option value="Orthopedic">Orthopedic</Option>
            </Select>
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="education" label="Education" rules={[{ required: true }]}><Input placeholder="e.g. MBBS, FCPS" /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="rating" label="Initial Rating"><Rate /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Button className="ad-modal-submit" htmlType="submit" loading={loading} block>
            Save Doctor
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminDashboard