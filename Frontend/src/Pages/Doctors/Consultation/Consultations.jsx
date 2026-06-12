import React, { useState, useRef, useEffect } from 'react'
import { Tabs, Tag, Button, Empty, Modal } from 'antd'
import { MessageOutlined, ClockCircleOutlined, CheckCircleOutlined, SendOutlined, PaperClipOutlined, FileTextOutlined } from '@ant-design/icons'
import API from '../../../api'
import './Consultations.css'

const getTime = () => {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function PrescriptionModal({ onClose, onSend }) {
  const [patient, setPatient] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [drugs, setDrugs] = useState([{ name: '', dose: '', duration: '' }])
  const [notes, setNotes] = useState('')

  const addDrug = () => setDrugs(prev => [...prev, { name: '', dose: '', duration: '' }])
  const removeDrug = i => setDrugs(prev => prev.filter((_, idx) => idx !== i))
  const updateDrug = (i, field, val) => setDrugs(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d))
  const handleSend = () => { onSend({ patient, diagnosis, drugs, notes, time: getTime() }); onClose() }

  return (
    <div className="rx-overlay" onClick={onClose}>
      <div className="rx-modal" onClick={e => e.stopPropagation()}>
        <div className="rx-modal-header">
          <p className="rx-modal-title">Write Prescription</p>
          <button className="rx-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="rx-modal-body">
          <div className="rx-grid">
            <div className="rx-field">
              <span className="rx-label">Patient Name</span>
              <input className="rx-input" value={patient} onChange={e => setPatient(e.target.value)} placeholder="Enter patient name" />
            </div>
            <div className="rx-field">
              <span className="rx-label">Date</span>
              <input className="rx-input" value={new Date().toLocaleDateString('en-PK')} readOnly />
            </div>
          </div>
          <div className="rx-field">
            <span className="rx-label">Diagnosis</span>
            <input className="rx-input" placeholder="e.g. Hypertension" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>
          <div className="rx-field">
            <span className="rx-label">Medicines</span>
            {drugs.map((drug, i) => (
              <div key={i} className="drug-row">
                <input className="drug-input drug-wide" placeholder="Medicine name" value={drug.name} onChange={e => updateDrug(i, 'name', e.target.value)} />
                <input className="drug-input" placeholder="Dose" value={drug.dose} onChange={e => updateDrug(i, 'dose', e.target.value)} />
                <input className="drug-input" placeholder="Duration" value={drug.duration} onChange={e => updateDrug(i, 'duration', e.target.value)} />
                {drugs.length > 1 && <button className="drug-remove" onClick={() => removeDrug(i)}>×</button>}
              </div>
            ))}
            <button className="drug-add-btn" onClick={addDrug}>+ Add medicine</button>
          </div>
          <div className="rx-field">
            <span className="rx-label">Notes / Advice</span>
            <textarea className="rx-textarea" placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button className="rx-send-btn" onClick={handleSend}>Send Prescription</button>
        </div>
      </div>
    </div>
  )
}

function PrescriptionCard({ rx }) {
  return (
    <div className="rx-card">
      <div className="rx-card-header">
        <span className="rx-card-icon">📋</span>
        <div>
          <p className="rx-card-title">Prescription</p>
          <p className="rx-card-meta">{rx.patient} · {rx.time}</p>
        </div>
      </div>
      {rx.diagnosis && <p className="rx-card-diagnosis">Diagnosis: {rx.diagnosis}</p>}
      {rx.drugs.filter(d => d.name).map((d, i) => (
        <p key={i} className="rx-card-drug">· {d.name}{d.dose ? ` — ${d.dose}` : ''}{d.duration ? ` (${d.duration})` : ''}</p>
      ))}
      {rx.notes && <p className="rx-card-notes">{rx.notes}</p>}
    </div>
  )
}

function ChatWindow({ patient, onSessionComplete }) {
  const [chatLog, setChatLog] = useState([])
  const [typedMessage, setTypedMessage] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [showRx, setShowRx] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const fileRef = useRef(null)
  const messagesEndRef = useRef(null)
  const apptId = patient.id

  const loadMessages = async () => {
    try {
      const { data } = await API.get(`/chat/${apptId}/messages`)
      const msgs = (data.data || []).map(m => ({
        id: m._id,
        sender: m.senderRole,
        from: m.senderRole,
        text: m.text,
        image: m.image,
        prescription: m.prescription,
        time: m.time,
      }))
      setChatLog(msgs)
      const completed = msgs.some(m => m.sender === 'system' && m.text?.includes('completed'))
      if (completed || patient.isCompleted) setIsCompleted(true)
    } catch {}
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [apptId])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatLog])

  const sendMsg = async (text, image, prescription) => {
    try {
      await API.post(`/chat/${apptId}/messages`, { text, image, prescription })
      loadMessages()
    } catch {}
  }

  const onFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setPendingImage({ url: URL.createObjectURL(file), name: file.name })
  }

  const clearImage = () => { setPendingImage(null); if (fileRef.current) fileRef.current.value = '' }

  const handleSend = () => {
    if (!typedMessage.trim() && !pendingImage) return
    if (isCompleted) return
    sendMsg(typedMessage.trim(), pendingImage?.url || null, null)
    setTypedMessage('')
    clearImage()
  }

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const onRxSend = rx => sendMsg('', null, rx)

  const handleCompleteSession = async () => {
    try {
      await API.put(`/chat/${apptId}/end`)
      setIsCompleted(true)
      if (onSessionComplete) onSessionComplete()
    } catch {}
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-patient-info">
          <div className="chat-patient-avatar">{patient.patientName?.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <p className="chat-patient-name">{patient.patientName}</p>
            <p className="chat-patient-id">Fee: Rs. {patient.fee} · Doctor: Rs. {patient.doctorShare} · Admin: Rs. {patient.adminShare}</p>
          </div>
        </div>
        <div className="chat-header-actions">
          {!isCompleted && (
            <button className="chat-complete-btn" onClick={handleCompleteSession}>
              <CheckCircleOutlined /> Complete Session
            </button>
          )}
          {!isCompleted && (
            <button className="chat-rx-btn" onClick={() => setShowRx(true)}>
              <FileTextOutlined /> Prescription
            </button>
          )}
          {isCompleted && <span className="chat-completed-badge">✓ Session Completed</span>}
        </div>
      </div>

      <div className="chat-messages-area">
        <div className="chat-system-msg">🔓 Consultation session started — payment confirmed</div>
        {chatLog.map((msg, i) => {
          const isDoctor = msg.sender === 'doctor' || msg.from === 'doctor'
          const isSystem = msg.sender === 'system' || msg.from === 'system'
          if (isSystem) return <div key={i} className="chat-system-msg chat-system-msg--alert">{msg.text}</div>
          if (msg.prescription) return (
            <div key={i} className="msg-row msg-doctor-row">
              <div className="msg-content-col">
                <PrescriptionCard rx={msg.prescription} />
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          )
          return (
            <div key={i} className={`msg-row ${isDoctor ? 'msg-doctor-row' : 'msg-patient-row'}`}>
              {isDoctor ? (
                <div className="msg-content-col msg-content-col--right">
                  {msg.image && <div className="msg-image-wrap"><img src={msg.image} alt="attachment" className="msg-image" /></div>}
                  {msg.text && <div className="msg-bubble msg-doctor">{msg.text}</div>}
                  <span className="msg-time msg-time--right">{msg.time}</span>
                </div>
              ) : (
                <div className="msg-content-col msg-content-col--left">
                  {msg.image && <div className="msg-image-wrap"><img src={msg.image} alt="attachment" className="msg-image" /></div>}
                  {msg.text && <div className="msg-bubble msg-patient">{msg.text}</div>}
                  <span className="msg-time">{msg.time}</span>
                </div>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isCompleted ? (
        <>
          {pendingImage && (
            <div className="chat-image-preview">
              <img src={pendingImage.url} alt="preview" className="preview-thumb" />
              <span className="preview-name">{pendingImage.name}</span>
              <button className="preview-clear" onClick={clearImage}>×</button>
            </div>
          )}
          <div className="chat-input-bar">
            <button className="chat-attach-btn" onClick={() => fileRef.current?.click()}><PaperClipOutlined /></button>
            <input type="file" accept="image/*" ref={fileRef} className="chat-file-hidden" onChange={onFileChange} />
            <textarea className="chat-textarea" placeholder="Type your response..." value={typedMessage} rows={1} onChange={e => setTypedMessage(e.target.value)} onKeyDown={handleKeyDown} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} className="chat-send-btn" />
          </div>
        </>
      ) : (
        <div className="chat-session-ended">🔒 Session completed. Messaging is disabled.</div>
      )}

      {showRx && <PrescriptionModal onClose={() => setShowRx(false)} onSend={onRxSend} />}
    </div>
  )
}

export default function Consultations() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activePatient, setActivePatient] = useState(null)
  const [liveChats, setLiveChats] = useState([])
  const [upcomingChats, setUpcomingChats] = useState([])
  const [completedChats, setCompletedChats] = useState([])

  const loadAppointments = async () => {
    try {
      const { data } = await API.get('/doctor/appointments')
      const appts = data.data || []

      const live = appts.filter(a => a.status === 'accepted').map(a => ({
        id: a.id,
        patientName: a.patient,
        time: a.time || 'N/A',
        problem: a.reason || a.type || 'Consultation',
        isPaid: a.paymentStatus === 'paid',
        fee: Number(a.fee || 0),
        doctorShare: Math.round(Number(a.fee || 0) * 0.9),
        adminShare: Math.round(Number(a.fee || 0) * 0.1),
      }))

      const upcoming = appts.filter(a => a.status === 'pending').map(a => ({
        id: a.id,
        patientName: a.patient,
        time: a.time || 'N/A',
        problem: a.reason || a.type || 'Consultation',
      }))

      const completed = appts.filter(a => a.status === 'completed').map(a => ({
        id: a.id,
        patientName: a.patient,
        time: a.time || 'N/A',
        problem: a.reason || a.type || 'Consultation',
        isPaid: true,
        fee: Number(a.fee || 0),
        doctorShare: Math.round(Number(a.fee || 0) * 0.9),
        adminShare: Math.round(Number(a.fee || 0) * 0.1),
        isCompleted: true,
      }))

      setLiveChats(live)
      setUpcomingChats(upcoming)
      setCompletedChats(completed)
    } catch {}
  }

  useEffect(() => {
    loadAppointments()
    const interval = setInterval(loadAppointments, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenChat = session => {
    if (!session.isPaid && !session.isCompleted) return
    setActivePatient(session)
    setIsChatOpen(true)
  }

  const ConsultCard = ({ session, isPaid = false, isCompleted = false }) => (
    <div className="consultation-card">
      <div>
        <div className="card-top-info">
          <div className="patient-meta">
            <div className={`patient-initials ${!isPaid && !isCompleted ? 'inactive-initials' : ''}`}>
              {session.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
            </div>
            <div className="meta-details">
              <h4>{session.patientName}</h4>
              <p>ID: #{String(session.id).slice(-6)}</p>
            </div>
          </div>
          {isPaid && !isCompleted && <Tag color="green">Live Chat</Tag>}
          {!isPaid && !isCompleted && <Tag color="orange">Awaiting Payment</Tag>}
          {isCompleted && <Tag color="blue">Completed</Tag>}
        </div>
        <div className="session-mid-details">
          <p><strong>Time:</strong> {session.time}</p>
          <p><strong>Complaint:</strong> {session.problem}</p>
          {session.fee > 0 && (
            <p>
              <strong>Fee:</strong> Rs. {session.fee} &nbsp;·&nbsp;
              <span className="fee-doctor">Doctor: Rs. {session.doctorShare}</span> &nbsp;·&nbsp;
              <span className="fee-admin">Admin: Rs. {session.adminShare}</span>
            </p>
          )}
        </div>
      </div>
      <div className="card-action-bar">
        {!isCompleted ? (
          <Button type="primary" icon={<MessageOutlined />} onClick={() => handleOpenChat(session)} disabled={!isPaid}>
            {isPaid ? 'Open Chat Room' : 'Waiting for Payment'}
          </Button>
        ) : (
          <Button icon={<MessageOutlined />} onClick={() => handleOpenChat(session)}>View Chat</Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="consultations-container">
      <div className="consultations-wrapper">
        <div className="consultations-header">
          <h2 className="consult-title">Text Consultations</h2>
          <p className="consult-subtitle">Manage your live chat queues and digital messaging rooms.</p>
        </div>
        <div className="tabs-card-wrapper">
          <Tabs defaultActiveKey="1" size="large">
            <Tabs.TabPane tab={<span><MessageOutlined /> Active ({liveChats.length})</span>} key="1">
              {liveChats.length === 0
                ? <Empty description="No active consultations." style={{ padding: '40px 0' }} />
                : <div className="consultation-list-grid">{liveChats.map(s => <ConsultCard key={s.id} session={s} isPaid={s.isPaid} />)}</div>
              }
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span><ClockCircleOutlined /> Pending ({upcomingChats.length})</span>} key="2">
              {upcomingChats.length === 0
                ? <Empty description="No pending appointments." style={{ padding: '40px 0' }} />
                : (
                  <div className="consultation-list-grid">
                    {upcomingChats.map(s => (
                      <div key={s.id} className="consultation-card">
                        <div className="card-top-info">
                          <div className="patient-meta">
                            <div className="patient-initials inactive-initials">{s.patientName?.split(' ').map(n => n[0]).join('')}</div>
                            <div className="meta-details"><h4>{s.patientName}</h4><p>ID: #{String(s.id).slice(-6)}</p></div>
                          </div>
                          <Tag color="default">Pending Approval</Tag>
                        </div>
                        <div className="session-mid-details">
                          <p><strong>Time:</strong> {s.time}</p>
                          <p><strong>Reason:</strong> {s.problem}</p>
                        </div>
                        <div className="card-action-bar">
                          <Button type="default" disabled>Chat Room Locked</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span><CheckCircleOutlined /> Completed ({completedChats.length})</span>} key="3">
              {completedChats.length === 0
                ? <Empty description="No completed consultations." style={{ padding: '40px 0' }} />
                : <div className="consultation-list-grid">{completedChats.map(s => <ConsultCard key={s.id} session={s} isCompleted />)}</div>
              }
            </Tabs.TabPane>
          </Tabs>
        </div>
        <Modal
          title={`Chat — ${activePatient?.patientName || ''}`}
          open={isChatOpen}
          onCancel={() => { setIsChatOpen(false); loadAppointments() }}
          footer={null}
          width={660}
          centered
          destroyOnClose
        >
          {activePatient && <ChatWindow patient={activePatient} onSessionComplete={loadAppointments} />}
        </Modal>
      </div>
    </div>
  )
}