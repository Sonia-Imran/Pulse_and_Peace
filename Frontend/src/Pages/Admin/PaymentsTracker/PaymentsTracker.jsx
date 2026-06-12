import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag, Button, Popconfirm, message } from 'antd'
import { DollarCircleOutlined, CheckCircleOutlined, SyncOutlined, PieChartOutlined, DeleteOutlined } from '@ant-design/icons'
import API from '../../../api'
import './PaymentsTracker.css'

const { Text } = Typography

const PaymentsTracker = () => {
  const [ledger, setLedger] = useState([])
  const [stats, setStats] = useState({ grossVolume: 0, platformCommission: 0, doctorPayouts: 0, pendingEscrow: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data } = await API.get('/admin/payments')
      setLedger(data.data || [])
      if (data.stats) setStats(data.stats)
    } catch {
      message.error('Failed to load payments')
    }
  }

  const handleDelete = async (aptId) => {
    try {
      await API.delete(`/admin/appointments/${aptId}`)
      message.success('Payment record deleted!')
      loadData()
    } catch {
      message.error('Failed to delete record')
    }
  }

  const columns = [
    { title: 'Transaction ID', dataIndex: 'txId', render: t => <Text className="pay-tx-id">{t}</Text> },
    { title: 'Source', dataIndex: 'source', render: s => <Tag className="pay-source-tag">{(s || '').toUpperCase()}</Tag> },
    { title: 'Patient', dataIndex: 'sender', render: t => <Text className="pay-sender">{t}</Text> },
    { title: 'Doctor', dataIndex: 'receiver', render: t => <Text className="pay-receiver">Dr. {t}</Text> },
    { title: 'Amount', dataIndex: 'amount', render: a => <Text className="pay-amount">Rs. {a}</Text> },
    { title: 'Admin Cut (10%)', dataIndex: 'adminCut', render: a => <Text className="pay-admin-cut">Rs. {a}</Text> },
    {
      title: 'Status', dataIndex: 'status',
      render: s => (
        <Tag
          className={`pay-status-tag ${s === 'Settled' ? 'pay-settled' : 'pay-pending'}`}
          icon={s === 'Settled' ? <CheckCircleOutlined /> : <SyncOutlined spin />}
        >
          {(s || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Popconfirm title="Delete this payment record?" okText="Delete" okType="danger" onConfirm={() => handleDelete(record.aptId)}>
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className="pay-wrapper">
      <div className="pay-page-header">
        <div className="pay-page-header-icon">💳</div>
        <div>
          <h2 className="pay-page-title">Financial Settlement Desk</h2>
          <p className="pay-page-sub">Monitor platform splits, doctor commissions and escrow accounts</p>
        </div>
      </div>

      <Row gutter={[16, 16]} className="pay-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="pay-stat-card">
            <div className="pay-stat-icon pay-icon-teal"><DollarCircleOutlined /></div>
            <Statistic title="Gross Volume" value={`Rs. ${stats.grossVolume}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="pay-stat-card">
            <div className="pay-stat-icon pay-icon-green"><PieChartOutlined /></div>
            <Statistic title="Admin Commission (10%)" value={`Rs. ${stats.platformCommission}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="pay-stat-card">
            <div className="pay-stat-icon pay-icon-blue"><CheckCircleOutlined /></div>
            <Statistic title="Doctor Payouts (90%)" value={`Rs. ${stats.doctorPayouts}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="pay-stat-card">
            <div className="pay-stat-icon pay-icon-orange"><SyncOutlined /></div>
            <Statistic title="Pending Escrow" value={`Rs. ${stats.pendingEscrow}`} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="pay-table-card" title={<Text className="pay-card-title">Consolidated Billing Ledger</Text>}>
        <Table
          dataSource={ledger}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 6 }}
          size="middle"
          className="pay-table"
        />
      </Card>
    </div>
  )
}

export default PaymentsTracker