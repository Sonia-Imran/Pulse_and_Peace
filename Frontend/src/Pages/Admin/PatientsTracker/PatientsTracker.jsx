import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Statistic, Typography, Table, Tag, Space,
  Input, Button, Modal, Avatar, Popconfirm, message, Descriptions, Timeline,
} from 'antd'
import {
  UserOutlined, MessageOutlined, ClockCircleOutlined,
  MedicineBoxOutlined, SearchOutlined, EyeOutlined,
  DeleteOutlined, LockOutlined,
} from '@ant-design/icons'
import API from '../../../api'
import './PatientsTracker.css'

const { Title, Text } = Typography

const PatientsTracker = () => {
  const [patientsData, setPatientsData] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [summaryStats, setSummaryStats] = useState({ totalPatients: 0, totalBotChats: 0, totalDuration: 0, totalDocConsults: 0 })
  const [profileModal, setProfileModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!search) { setFiltered(patientsData); return }
    const q = search.toLowerCase()
    setFiltered(patientsData.filter(p => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)))
  }, [search, patientsData])

  const loadData = async () => {
    try {
      const { data } = await API.get('/admin/patients/stats')
      const patients = data.data || []
      let totalDocConsults = 0
      patients.forEach(p => { totalDocConsults += p.doctorConsultCount || 0 })
      setPatientsData(patients)
      setFiltered(patients)
      setSummaryStats({ totalPatients: patients.length, totalBotChats: 0, totalDuration: 0, totalDocConsults })
    } catch {
      message.error('Failed to load patients data')
    }
  }

  const handleDelete = async (record) => {
    try {
      await API.delete(`/admin/users/${record.id}`)
      message.success(`${record.name} deleted successfully!`)
      loadData()
    } catch {
      message.error('Failed to delete patient')
    }
  }

  const toggleStatus = async (record) => {
    try {
      await API.put(`/admin/users/${record.id}/toggle-status`)
      message.success(`${record.name} ${record.status === 'active' ? 'blocked' : 'activated'}!`)
      loadData()
    } catch {
      message.error('Failed to update status')
    }
  }

  const stats = [
    { title: 'Tracked Patients', value: summaryStats.totalPatients, icon: <UserOutlined />, color: 'green' },
    { title: 'Total Bot Conversations', value: summaryStats.totalBotChats, icon: <MessageOutlined />, color: 'teal' },
    { title: 'Total Chat Duration', value: `${summaryStats.totalDuration} Mins`, icon: <ClockCircleOutlined />, color: 'blue' },
    { title: 'Doctor Consultations', value: summaryStats.totalDocConsults, icon: <MedicineBoxOutlined />, color: 'purple' },
  ]

  const columns = [
    {
      title: 'Patient', dataIndex: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size={36} icon={<UserOutlined />} className="pt-avatar" />
          <Space direction="vertical" size={0}>
            <Text className="pt-name">{text}</Text>
            <Text className="pt-email">{record.email}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status', dataIndex: 'status',
      render: s => <Tag className={`pt-tag ${s === 'active' ? 'pt-tag-teal' : 'pt-tag-red'}`}>{s === 'active' ? 'Active' : 'Blocked'}</Tag>,
    },
    {
      title: 'Bot Chats',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text className="pt-cell-main">{r.botChatCount} chats</Text>
          <Text className="pt-cell-sub">{r.botDurationMinutes} mins</Text>
        </Space>
      ),
    },
    {
      title: 'Last Bot Session', dataIndex: 'lastBotChat',
      render: d => <Tag className={`pt-tag ${d === 'Never' || d === 'N/A' ? 'pt-tag-grey' : 'pt-tag-teal'}`}>{d}</Tag>,
    },
    {
      title: 'Doctor Consults',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text className="pt-cell-main">{r.doctorConsultCount} sessions</Text>
          {r.assignedDoctor !== 'None' && <Text className="pt-cell-doctor">{r.assignedDoctor}</Text>}
        </Space>
      ),
    },
    {
      title: 'Last Visit', dataIndex: 'lastDoctorConsult',
      render: d => <Tag className={`pt-tag ${d === 'N/A' || d === 'Never' ? 'pt-tag-orange' : 'pt-tag-blue'}`}>{d}</Tag>,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button className="pt-btn-view" icon={<EyeOutlined />} onClick={() => { setSelectedPatient(record); setProfileModal(true) }}>View</Button>
          <Button
            className={`pt-btn-status ${record.status === 'active' ? 'pt-btn-block' : 'pt-btn-activate'}`}
            icon={<LockOutlined />}
            onClick={() => toggleStatus(record)}
          >
            {record.status === 'active' ? 'Block' : 'Activate'}
          </Button>
          <Popconfirm title="Delete this patient?" onConfirm={() => handleDelete(record)} okText="Yes" cancelText="No">
            <Button className="pt-btn-delete" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="pt-wrapper">
      <div className="pt-page-header">
        <div className="pt-page-header-icon">👥</div>
        <div>
          <h2 className="pt-page-title">Patients Activity Tracker</h2>
          <p className="pt-page-sub">Monitor chatbot statistics and consultation logs</p>
        </div>
      </div>

      <Row gutter={[16, 16]} className="pt-stats-row">
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card bordered={false} className={`pt-stat-card pt-stat-${stat.color}`}>
              <div className="pt-stat-icon">{stat.icon}</div>
              <Statistic title={stat.title} value={stat.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="pt-table-card">
        <div className="pt-toolbar">
          <Title level={5} className="pt-table-title">Patient Engagement Log</Title>
          <div className="pt-search-box">
            <SearchOutlined className="pt-search-icon" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pt-search-input" bordered={false} allowClear />
          </div>
        </div>
        <Table dataSource={filtered} columns={columns} rowKey="key" pagination={{ pageSize: 5 }} size="middle" className="pt-table" />
      </Card>

      <Modal
        open={profileModal}
        onCancel={() => setProfileModal(false)}
        footer={null}
        width={580}
        className="pt-modal"
        title={
          <div className="pt-modal-title">
            <Avatar size={44} icon={<UserOutlined />} className="pt-modal-avatar" />
            <div>
              <Text className="pt-modal-name">{selectedPatient?.name}</Text>
              <Text className="pt-modal-sub">Patient Full Profile</Text>
            </div>
          </div>
        }
      >
        {selectedPatient && (
          <div className="pt-modal-content">
            <div className="pt-section">
              <h4 className="pt-section-title">Personal Information</h4>
              <Descriptions column={2} className="pt-desc">
                <Descriptions.Item label="Age">{selectedPatient.age}</Descriptions.Item>
                <Descriptions.Item label="Gender">{selectedPatient.gender}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedPatient.phone}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedPatient.email}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag className={`pt-tag ${selectedPatient.status === 'active' ? 'pt-tag-teal' : 'pt-tag-red'}`}>{selectedPatient.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
            <div className="pt-section">
              <h4 className="pt-section-title">AI Chat Activity</h4>
              <div className="pt-chat-info">
                <div className="pt-chat-stat">
                  <MessageOutlined className="pt-chat-icon" />
                  <div><Text className="pt-chat-val">{selectedPatient.botChatCount} Conversations</Text><Text className="pt-chat-sub">Total AI chat sessions</Text></div>
                </div>
                <div className="pt-chat-stat">
                  <ClockCircleOutlined className="pt-chat-icon" />
                  <div><Text className="pt-chat-val">{selectedPatient.botDurationMinutes} Minutes</Text><Text className="pt-chat-sub">Total time spent</Text></div>
                </div>
                <div className="pt-chat-stat">
                  <LockOutlined className="pt-chat-icon" />
                  <div><Text className="pt-chat-val">Private & Encrypted</Text><Text className="pt-chat-sub">Chat content not accessible</Text></div>
                </div>
              </div>
              <div className="pt-privacy-note">
                <LockOutlined className="pt-privacy-icon" />
                <Text className="pt-privacy-text">AI chat conversations are private and encrypted. Only the patient can view their chat history.</Text>
              </div>
            </div>
            <div className="pt-section">
              <h4 className="pt-section-title">Doctor Consultation History</h4>
              {!selectedPatient.consultationHistory?.length
                ? <Text className="pt-no-data">No consultations yet</Text>
                : <Timeline className="pt-timeline" items={selectedPatient.consultationHistory.map(c => ({
                    color: '#1d9e75',
                    children: (
                      <div className="pt-timeline-item">
                        <Text className="pt-tl-date">{c.date}</Text>
                        <Text className="pt-tl-main">{c.type} with {c.doctor}</Text>
                        <Text className="pt-tl-sub">Duration: {c.duration}</Text>
                      </div>
                    ),
                  }))} />
              }
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PatientsTracker