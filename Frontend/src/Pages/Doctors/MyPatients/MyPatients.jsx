import { useState, useEffect } from 'react'
import { Table, Input, Tag, Button, Modal, Descriptions, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import API from '../../../api'
import './MyPatients.css'

export default function MyPatients() {
  const [searchText, setSearchText]     = useState('')
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientsData, setPatientsData] = useState([])
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    loadPatients()
    window.addEventListener('new-appointment', loadPatients)
    return () => window.removeEventListener('new-appointment', loadPatients)
  }, [])

  const loadPatients = async () => {
    const token = localStorage.getItem('doctor-token')

    if (token) {
      setLoading(true)
      try {
        const { data } = await API.get('/doctor/patients')
        setPatientsData(data.data || [])
      } catch (err) {
        console.error('Load patients error:', err.response?.data)
        message.error('Failed to load patients')
        setPatientsData([])
      } finally {
        setLoading(false)
      }
      return
    }

    // Fallback for offline/demo mode (no backend session)
    const appointments  = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
    const users         = JSON.parse(localStorage.getItem('localUsers')      || '[]')
    const patientProf   = JSON.parse(localStorage.getItem('patient_profile') || '{}')

    const accepted = appointments.filter(a => a.status === 'accepted' || a.status === 'completed')

    const patientMap = {}
    accepted.forEach(appt => {
      const user  = users.find(u => u._id === appt.patientId)
      const name  = user?.fullName || patientProf?.fullName || appt.patient || appt.patientName || 'Patient'
      const key   = appt.patientId || name

      if (!patientMap[key]) {
        patientMap[key] = {
          id:          appt.patientId || key,
          name,
          email:       user?.email    || patientProf?.email || 'N/A',
          phone:       user?.phone    || appt.phone || patientProf?.phone || 'N/A',
          age:         user?.age      || patientProf?.age   || '—',
          gender:      user?.gender   || patientProf?.gender || '—',
          bloodGroup:  user?.bloodGroup || patientProf?.bloodGroup || '—',
          totalVisits: 0,
          lastVisit:   'N/A',
        }
      }
      patientMap[key].totalVisits++
      if (appt.date) patientMap[key].lastVisit = appt.date
    })

    setPatientsData(Object.values(patientMap))
  }

  const columns = [
    {
      title: 'Patient Details',
      dataIndex: 'name',
      render: (text, record) => (
        <div className="patient-info-cell">
          <div className="patient-avatar-text">{(record.name || 'P').split(' ').map(n => n[0]).join('')}</div>
          <div>
            <p className="patient-meta-name">{record.name}</p>
            <p className="patient-meta-sub">PT-{String(record.id).slice(-4).toUpperCase()} | {record.phone}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Age / Gender',
      render: (_, r) => <span>{r.age || '—'} | {r.gender || '—'}</span>,
    },
    {
      title: 'Blood Group',
      dataIndex: 'bloodGroup',
      render: b => <Tag color="red">{b || '—'}</Tag>,
    },
    { title: 'Last Visit',    dataIndex: 'lastVisit' },
    {
      title: 'Total Visits',
      dataIndex: 'totalVisits',
      render: v => <Tag color="blue">{v} Times</Tag>,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => { setSelectedPatient(record); setIsModalOpen(true) }}>
          View Records
        </Button>
      ),
    },
  ]

  const filteredData = patientsData.filter(p =>
    (p.name || '').toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div className="patients-container">
      <div className="patients-wrapper">
        <div className="page-top-header">
          <h2 className="page-top-title">My Patients</h2>
          <p className="page-top-sub">Detailed list of all patients under your care and their visit history.</p>
        </div>

        <div className="search-filter-section">
          <Input
            placeholder="Search patient by name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: '400px', borderRadius: '6px' }}
            allowClear
          />
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'No patients found. Patients appear after approved consultations.' }}
          />
        </div>

        <Modal
          title={`Medical Case File: ${selectedPatient?.name || ''}`}
          open={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          width={600}
          okText="Close File"
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          {selectedPatient && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Patient ID">PT-{String(selectedPatient.id).slice(-4).toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="Blood Group">{selectedPatient.bloodGroup || '—'}</Descriptions.Item>
              <Descriptions.Item label="Age / Gender">{selectedPatient.age || '—'} / {selectedPatient.gender || '—'}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selectedPatient.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>{selectedPatient.email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Total Visits" span={2}>{selectedPatient.totalVisits} consultations</Descriptions.Item>
              <Descriptions.Item label="Last Visit" span={2}>{selectedPatient.lastVisit || 'N/A'}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </div>
  )
}