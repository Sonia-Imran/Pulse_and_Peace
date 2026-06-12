import { useState, useEffect } from 'react'
import { Table, Input, Button, Tag, Modal, Form, Select, message, Popconfirm, Tooltip, Tabs } from 'antd'
import { SearchOutlined, PlusOutlined, FileTextOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MessageOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import API from '../../../api'
import './PatientRecords.css'

const { Option } = Select

function PatientRecords() {
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [activePrintRecord, setActivePrintRecord] = useState(null)
  const [recordsData, setRecordsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const [apptRes, chatRes] = await Promise.all([
        API.get('/doctor/appointments'),
        Promise.resolve({ data: { data: [] } }),
      ])

      const appointments = apptRes.data.data || []
      const chatLogs = JSON.parse(localStorage.getItem('pp_chat_logs') || '{}')
      const manualRecs = JSON.parse(localStorage.getItem('doctor_manual_records') || '[]')

      const autoRows = appointments
        .filter(a => a.status === 'accepted' || a.status === 'completed')
        .map(appt => {
          const logs = chatLogs[appt.id] || []
          const prescriptions = logs
            .filter(m => m.prescription)
            .map(m => ({
              date: appt.date || 'N/A',
              diagnosis: m.prescription.diagnosis || 'N/A',
              meds: (m.prescription.drugs || []).filter(d => d.name).map(d => ({
                name: d.name,
                dosage: `${d.dose || ''}${d.duration ? ` — ${d.duration}` : ''}`.trim() || 'As directed',
              })),
            }))

          const chatHistory = logs.filter(m => m.text).map(m => ({
            role: m.sender === 'doctor' ? 'doctor' : 'patient',
            text: m.text,
            time: m.time,
          }))

          return {
            key: `auto_${appt.id}`,
            id: `REC-${String(appt.id).slice(-4).toUpperCase()}`,
            patientName: appt.patient || 'Patient',
            gender: appt.gender || '—',
            diagnosis: prescriptions[0]?.diagnosis || appt.reason || appt.type || 'Consultation',
            status: appt.status === 'completed' ? 'Recovered' : 'Under Treatment',
            billing: appt.paymentStatus === 'paid' ? 'Paid' : 'Pending',
            date: appt.date || new Date().toISOString().split('T')[0],
            medicines: prescriptions.flatMap(p => p.meds),
            chatHistory,
            isAuto: true,
          }
        })

      setRecordsData([...autoRows, ...manualRecs])
    } catch {
      setRecordsData([])
    } finally {
      setLoading(false)
    }
  }

  const saveManualRecords = (records) => {
    localStorage.setItem('doctor_manual_records', JSON.stringify(records.filter(r => !r.isAuto)))
  }

  const handlePrint = (record) => {
    setActivePrintRecord(record)
    message.loading(`Generating print file for ${record.patientName}...`, 0.8)
    setTimeout(() => window.print(), 300)
  }

  const showCreateModal = () => {
    setIsEditMode(false)
    setEditingKey(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const showEditModal = (record) => {
    setIsEditMode(true)
    setEditingKey(record.key)
    form.setFieldsValue({ patientName: record.patientName, gender: record.gender, diagnosis: record.diagnosis, status: record.status, billing: record.billing })
    setIsModalOpen(true)
  }

  const handleDelete = (key) => {
    const updated = recordsData.filter(item => item.key !== key)
    setRecordsData(updated)
    saveManualRecords(updated)
    message.success('Medical record deleted successfully.')
  }

  const handleFormSubmit = (values) => {
    let updated
    if (isEditMode) {
      updated = recordsData.map(item => item.key === editingKey ? { ...item, ...values } : item)
      message.success('Medical record updated successfully!')
    } else {
      const newRecord = {
        key: Date.now().toString(),
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: values.patientName,
        gender: values.gender,
        diagnosis: values.diagnosis,
        status: values.status,
        billing: values.billing,
        date: new Date().toISOString().split('T')[0],
        medicines: [],
        chatHistory: [],
        isAuto: false,
      }
      updated = [newRecord, ...recordsData]
      message.success('New medical record created successfully!')
    }
    setRecordsData(updated)
    saveManualRecords(updated)
    setIsModalOpen(false)
    form.resetFields()
  }

  const columns = [
    {
      title: 'Record ID / Patient',
      dataIndex: 'patientName',
      render: (text, record) => (
        <div className="patient-cell-info">
          <div className="patient-avatar-badge">{(record.patientName || 'P').split(' ').map(n => n[0]).join('')}</div>
          <div>
            <p className="patient-record-name">{record.patientName}</p>
            <p className="patient-record-id">{record.id} | {record.gender}</p>
          </div>
        </div>
      ),
    },
    { title: 'Medical Diagnosis', dataIndex: 'diagnosis', render: d => <span className="table-diag-text">{d}</span> },
    { title: 'Created Date', dataIndex: 'date' },
    {
      title: 'Clinical Status',
      dataIndex: 'status',
      render: s => <Tag color={s === 'Recovered' ? 'green' : 'blue'}>{s}</Tag>,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <div className="action-buttons-group">
          <Tooltip title="View Session History">
            <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setIsDetailsOpen(true) }} />
          </Tooltip>
          <Tooltip title="Print Sheet">
            <Button type="default" icon={<FileTextOutlined />} onClick={() => handlePrint(record)} />
          </Tooltip>
          <Tooltip title="Edit Record">
            <Button type="default" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm title="Are you sure to delete this clinical file?" onConfirm={() => handleDelete(record.key)} okButtonProps={{ danger: true }}>
              <Button type="default" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ]

  const filteredRecords = recordsData.filter(rec =>
    rec.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
    rec.id.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div className="records-container">
      <div className="records-wrapper">
        <div className="page-top-header">
          <div className="records-header-inner">
            <div>
              <h2 className="page-top-title">Patient Medical Records</h2>
              <p className="page-top-sub">Access and maintain medical histories, treatment files, and chat logs.</p>
            </div>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showCreateModal}>Add Clinical Record</Button>
          </div>
        </div>

        <div className="search-bar-panel">
          <Input placeholder="Search records..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ maxWidth: '450px', borderRadius: '6px' }} allowClear />
        </div>

        <div className="records-table-wrapper">
          <Table columns={columns} dataSource={filteredRecords} rowKey="key" loading={loading} pagination={{ pageSize: 5 }} locale={{ emptyText: 'No records found. Records auto-generate from accepted consultations.' }} />
        </div>

        <Modal title={`Medical History: ${selectedRecord?.patientName || ''}`} open={isDetailsOpen} onCancel={() => setIsDetailsOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailsOpen(false)}>Close Archive</Button>]} width={700} centered>
          <Tabs defaultActiveKey="presc-tab">
            <Tabs.TabPane tab={<span><MedicineBoxOutlined /> Prescribed Medicines</span>} key="presc-tab">
              <div className="prescription-view-box">
                <h4>Active Diagnosis Summary</h4>
                <p><strong>{selectedRecord?.diagnosis}</strong></p>
              </div>
              <div className="prescription-view-box">
                <h4>Rx — Advised Medicines List</h4>
                {selectedRecord?.medicines?.length > 0 ? (
                  selectedRecord.medicines.map((med, idx) => (
                    <div className="medicine-item-row" key={idx}>
                      <span className="medicine-name">{med.name}</span>
                      <span className="medicine-dosage">{med.dosage}</span>
                    </div>
                  ))
                ) : <p style={{ color: '#8c8c8c', fontSize: '13px' }}>No medicines prescribed yet.</p>}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span><MessageOutlined /> Saved Chat Logs</span>} key="chat-tab">
              <div className="record-chat-history-back">
                {selectedRecord?.chatHistory?.length > 0 ? (
                  selectedRecord.chatHistory.map((chat, idx) => (
                    <div key={idx} className={`record-chat-bubble ${chat.role === 'doctor' ? 'bubble-doc' : 'bubble-pat'}`}>
                      <strong>{chat.role === 'doctor' ? 'Doctor' : selectedRecord?.patientName}:</strong>
                      <p style={{ margin: '4px 0 0 0' }}>{chat.text}</p>
                      <span className="bubble-meta-time">{chat.time}</span>
                    </div>
                  ))
                ) : <p style={{ color: '#8c8c8c', fontSize: '13px' }}>No chat history found.</p>}
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Modal>

        {activePrintRecord && (
          <div className="print-case-sheet">
            <div className="print-header"><h1>PULSE & PEACE</h1><p>Your Wellness Companion | Medical Case File</p></div>
            <div className="print-patient-meta">
              <div>
                <p><strong>Patient Name:</strong> {activePrintRecord.patientName}</p>
                <p><strong>Gender:</strong> {activePrintRecord.gender}</p>
                <p><strong>Record Reference ID:</strong> {activePrintRecord.id}</p>
              </div>
              <div className="print-meta-right">
                <p><strong>Date:</strong> {activePrintRecord.date}</p>
                <p><strong>Clinical Status:</strong> {activePrintRecord.status}</p>
              </div>
            </div>
            <div className="print-diagnosis-box">
              <h3>Official Diagnosis</h3>
              <p className="print-diagnosis-text">{activePrintRecord.diagnosis}</p>
            </div>
            <div className="print-diagnosis-box">
              <h3>Rx — Prescribed Plan</h3>
              {activePrintRecord.medicines?.length > 0
                ? activePrintRecord.medicines.map((med, idx) => <p key={idx} style={{ margin: '4px 0', fontSize: '14px' }}>• <strong>{med.name}</strong> — {med.dosage}</p>)
                : <p>No medicines listed.</p>}
            </div>
            <div className="print-footer-signature">
              <p className="print-sig-line">Authorized Doctor Signature</p>
              <p>System Generated Copy</p>
            </div>
          </div>
        )}

        <Modal title={isEditMode ? 'Update Clinical Case Entry' : 'Log New Medical Case Entry'} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} centered>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '16px' }}>
            <Form.Item name="patientName" label="Patient Full Name" rules={[{ required: true, message: 'Required' }]}><Input placeholder="e.g. Ali Hassan" /></Form.Item>
            <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Required' }]}><Select placeholder="Select gender"><Option value="Male">Male</Option><Option value="Female">Female</Option></Select></Form.Item>
            <Form.Item name="diagnosis" label="Diagnosis Summary" rules={[{ required: true, message: 'Required' }]}><Input placeholder="e.g. Hypertension Stage 2" /></Form.Item>
            <Form.Item name="status" label="Clinical Status" initialValue="Under Treatment"><Select><Option value="Under Treatment">Under Treatment</Option><Option value="Recovered">Recovered</Option></Select></Form.Item>
            <Form.Item name="billing" label="Consultation Fee Status" initialValue="Paid"><Select><Option value="Paid">Paid</Option><Option value="Pending">Pending</Option></Select></Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: '24px' }}>
              <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: '8px' }}>Cancel</Button>
              <Button type="primary" htmlType="submit">{isEditMode ? 'Update File' : 'Save Case File'}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default PatientRecords