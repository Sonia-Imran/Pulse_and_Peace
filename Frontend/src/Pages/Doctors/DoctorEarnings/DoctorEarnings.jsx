import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Empty, message } from 'antd'
import { BankOutlined, RiseOutlined, CalendarOutlined } from '@ant-design/icons'
import API from '../../../api'
import './DoctorEarnings.css'

export default function DoctorEarnings() {
  const [stats, setStats] = useState({ totalRevenue: 0, doctorShare: 0, adminShare: 0, totalPaid: 0 })
  const [transactions, setTransactions] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data } = await API.get('/doctor/earnings')
      setTransactions(data.data || [])
      if (data.stats) setStats(data.stats)
    } catch {
      message.error('Failed to load earnings data')
    }
  }

  const columns = [
    {
      title: 'Patient',
      dataIndex: 'patient',
      render: name => (
        <div className="earn-patient-cell">
          <div className="earn-avatar">{(name || 'P')[0].toUpperCase()}</div>
          <span className="earn-patient-name">{name}</span>
        </div>
      ),
    },
    { title: 'Service', dataIndex: 'service', render: s => <span className="earn-service">{s}</span> },
    { title: 'Date', dataIndex: 'date', render: d => <span className="earn-date">{d}</span> },
    { title: 'Total Fee', dataIndex: 'fee', render: f => <span className="earn-fee">Rs. {f}</span> },
    { title: 'My Share (90%)', dataIndex: 'doctorShare', render: s => <span className="earn-my-share">Rs. {s}</span> },
    { title: 'Admin (10%)', dataIndex: 'adminShare', render: s => <span className="earn-admin-share">Rs. {s}</span> },
    { title: 'Status', dataIndex: 'status', render: () => <Tag className="earn-paid-tag">Paid</Tag> },
  ]

  return (
    <div className="earnings-container">
      <div className="page-top-header">
        <h2 className="page-top-title">Doctor Earnings</h2>
        <p className="page-top-sub">Track your consultation revenue and payment splits</p>
      </div>

      <Row gutter={[20, 20]} className="earnings-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="earn-stat-card earn-stat-total">
            <Statistic title="Total Revenue" value={`Rs. ${stats.totalRevenue}`} prefix={<BankOutlined className="earn-icon-total" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="earn-stat-card earn-stat-mine">
            <Statistic title="My Earnings (90%)" value={`Rs. ${stats.doctorShare}`} prefix={<RiseOutlined className="earn-icon-mine" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="earn-stat-card earn-stat-admin">
            <Statistic title="Platform Fee (10%)" value={`Rs. ${stats.adminShare}`} prefix={<BankOutlined className="earn-icon-admin" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="earn-stat-card earn-stat-count">
            <Statistic title="Paid Consultations" value={stats.totalPaid} prefix={<CalendarOutlined className="earn-icon-count" />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="earnings-table-card">
        <div className="earn-table-header">
          <h3 className="earn-table-title">Transaction History</h3>
        </div>
        {transactions.length === 0
          ? <Empty description="No paid consultations yet" className="earn-empty" />
          : <Table columns={columns} dataSource={transactions} rowKey="id" pagination={{ pageSize: 8 }} className="earn-table" />
        }
      </Card>
    </div>
  )
}