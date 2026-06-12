import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Header from '../../../Components/Header/Header'
import Footer from '../../../Components/Footer/Footer'
import API from '../../../api'
import { MoreVertical, Clock } from 'lucide-react'
import './ConsultationChat.css'

const getTime = () => {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function PrescriptionCard({ rx }) {
  return (
    <div className="prescription-card">
      <div className="rx-card-header">
        <span className="rx-card-icon">📋</span>
        <div>
          <p className="rx-card-title">Prescription</p>
          <p className="rx-card-meta">{rx.patient} · {rx.time}</p>
        </div>
      </div>
      {rx.diagnosis && <p className="rx-diagnosis">Diagnosis: {rx.diagnosis}</p>}
      {rx.drugs?.filter(d => d.name).map((d, i) => (
        <p key={i} className="rx-drug-item">
          · {d.name}{d.dose ? ` — ${d.dose}` : ''}{d.duration ? ` (${d.duration})` : ''}
        </p>
      ))}
      {rx.notes && <p className="rx-note-text">{rx.notes}</p>}
    </div>
  )
}

export default function ConsultationChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const socketRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [doctorName, setDoctorName] = useState('Doctor')
  const [isAccepted, setIsAccepted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistories, setChatHistories] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  const bodyRef = useRef(null)
  const menuRef = useRef(null)

  const currentId = String(activeChatId || id || '')

  useEffect(() => {
    if (!id) return
    setActiveChatId(String(id).trim())
    loadBookingAndMessages(id)
  }, [id])

  useEffect(() => {
    if (!currentId) return
    socketRef.current = io('http://localhost:5000')
    socketRef.current.emit('join_room', currentId)
    socketRef.current.on('receive_message', (data) => {
      if (data.sender === 'doctor' || data.from === 'doctor') {
        setMessages(prev => [...prev, data])
      }
    })
    socketRef.current.on('consultation_ended', () => {
      setIsCompleted(true)
    })
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [currentId])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    const handle = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowHeaderMenu(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const loadBookingAndMessages = async (bookingId) => {
    setLoading(true)
    try {
      const { data: apptData } = await API.get(`/patient/appointments/${bookingId}`)
      const appt = apptData.data
      if (appt) {
        setBookingInfo(appt)
        setDoctorName(appt.doctorName ? `Dr. ${appt.doctorName}` : 'Doctor')
        setIsAccepted(appt.status === 'accepted' || appt.status === 'completed')
        setIsCompleted(appt.status === 'completed')
      }
      const { data: msgData } = await API.get(`/chat/${bookingId}/messages`)
      const mapped = (msgData.data || []).map(m => ({
        id:           m._id,
        sender:       m.senderRole,
        from:         m.senderRole,
        text:         m.text,
        prescription: m.prescription,
        time:         m.time,
        isEdited:     m.isEdited,
      }))
      setMessages(mapped)
      const chatLogs = JSON.parse(localStorage.getItem('pp_chat_logs') || '{}')
      chatLogs[bookingId] = mapped
      localStorage.setItem('pp_chat_logs', JSON.stringify(chatLogs))
    } catch {
      const appts = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
      const appt = appts.find(a => String(a.id || a._id) === String(bookingId))
      if (appt) {
        setBookingInfo(appt)
        setDoctorName(appt.doctorName ? `Dr. ${appt.doctorName}` : 'Doctor')
        setIsAccepted(appt.status === 'accepted' || appt.status === 'completed')
        setIsCompleted(appt.status === 'completed')
      }
      const logs = JSON.parse(localStorage.getItem('pp_chat_logs') || '{}')
      setMessages(logs[bookingId] || [])
    } finally {
      setLoading(false)
    }
  }

  const loadHistories = async () => {
    try {
      const { data } = await API.get('/patient/appointments')
      const histories = (data.data || [])
        .filter(a => a.status === 'accepted' || a.status === 'completed')
        .map(a => ({
          id:         a.id || a._id,
          label:      a.type || 'Consultation',
          date:       a.date || '',
          doctorName: a.doctorName || 'Doctor',
        }))
      setChatHistories(histories)
    } catch {
      const appts = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
      setChatHistories(
        appts
          .filter(a => a.status === 'accepted' || a.status === 'completed')
          .map(a => ({
            id:         a.id,
            label:      a.type || 'Consultation',
            date:       a.date || '',
            doctorName: a.doctorName || 'Doctor',
          }))
      )
    }
  }

  useEffect(() => { loadHistories() }, [])

  const sendMessage = async () => {
    if (!inputText.trim()) return
    if (!currentId || isCompleted) return

    const text = inputText.trim()
    setInputText('')

    try {
      const { data } = await API.post(`/chat/${currentId}/messages`, { text })
      const saved = data.data
      const msgData = {
        id:     saved._id,
        sender: saved.senderRole,
        from:   saved.senderRole,
        text:   saved.text,
        time:   saved.time,
      }
      setMessages(prev => [...prev, msgData])
      if (socketRef.current) {
        socketRef.current.emit('send_message', { ...msgData, roomId: currentId })
      }
    } catch {
      setMessages(prev => [...prev, {
        id:     Date.now(),
        sender: 'patient',
        from:   'patient',
        text,
        time:   getTime(),
      }])
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setShowClearConfirm(false)
    setShowHeaderMenu(false)
    const logs = JSON.parse(localStorage.getItem('pp_chat_logs') || '{}')
    logs[currentId] = []
    localStorage.setItem('pp_chat_logs', JSON.stringify(logs))
  }

  const handleSwitchChat = (chatId) => {
    setActiveChatId(String(chatId))
    loadBookingAndMessages(chatId)
    setShowHistory(false)
    navigate(`/consultation/${chatId}`)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getInitials = name => name.replace('Dr.', '').trim().slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <>
        <Header />
        <div className="chat-root">
          <div className="chat-container">
            <div className="chat-loading">Loading consultation...</div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!isAccepted) {
    return (
      <>
        <Header />
        <div className="chat-root">
          <div className="chat-container">
            <div className="chat-header">
              <div className="avatar-lg">{getInitials(doctorName)}</div>
              <div className="header-info">
                <p className="doctor-name">{doctorName}</p>
                <div className="online-status">
                  <div className="online-dot pending-dot" />
                  <span className="status-text">Awaiting doctor approval...</span>
                </div>
              </div>
              <span className="pending-badge">⏳ Pending</span>
            </div>
            <div className="messages-area pending-area">
              <div className="pending-msg">
                <div className="pending-icon">⏳</div>
                <h3 className="pending-title">Waiting for Doctor</h3>
                <p className="pending-desc">
                  Your request has been sent. The doctor will approve it shortly.
                </p>
                <div className="pending-info">
                  <div className="pending-info-row">
                    <span className="pending-label">Service</span>
                    <span className="pending-value">{bookingInfo?.type || 'Consultation'}</span>
                  </div>
                  <div className="pending-info-row">
                    <span className="pending-label">Date</span>
                    <span className="pending-value">{bookingInfo?.date || 'N/A'}</span>
                  </div>
                  <div className="pending-info-row">
                    <span className="pending-label">Status</span>
                    <span className="pending-value pending-status">Pending Approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="chat-root">
        <div className="chat-layout">
          {showHistory && (
            <div className="chat-history-sidebar open">
              <div className="history-header">
                <h4 className="history-title">💬 Chat History</h4>
                <button className="history-close" onClick={() => setShowHistory(false)}>×</button>
              </div>
              <button className="sidebar-new-chat-btn" onClick={() => navigate('/my-appointments')}>
                <span>✚</span> New Consultation
              </button>
              <div className="history-list">
                {chatHistories.length === 0 ? (
                  <p className="history-empty">No previous chats</p>
                ) : (
                  chatHistories.map(h => (
                    <div
                      key={h.id}
                      className={`history-item ${String(h.id) === currentId ? 'active' : ''}`}
                      onClick={() => handleSwitchChat(h.id)}
                    >
                      <div className="history-item-icon">{h.label[0]?.toUpperCase()}</div>
                      <div className="history-item-body">
                        <p className="history-item-label">{h.label}</p>
                        <p className="history-item-meta">Dr. {h.doctorName} · {h.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showHistory && (
            <div className="sidebar-overlay" onClick={() => setShowHistory(false)} />
          )}

          <div className="chat-container">
            <div className="chat-header">
              <div className="avatar-lg">{getInitials(doctorName)}</div>
              <div className="header-info">
                <p className="doctor-name">{doctorName}</p>
                <div className="online-status">
                  <div className={`online-dot ${isCompleted ? 'completed-dot' : ''}`} />
                  <span className="status-text">
                    {isCompleted ? 'Session Completed' : 'Online · Consultation Active'}
                  </span>
                </div>
              </div>
              <div className="header-actions">
                <div className="header-more-dropdown" ref={menuRef}>
                  <button
                    className="header-dots-btn"
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showHeaderMenu && (
                    <div className="header-dropdown-menu">
                      <button
                        className="header-menu-item"
                        onClick={() => { setShowHistory(true); setShowHeaderMenu(false) }}
                      >
                        <Clock size={14} /> View History
                      </button>
                      <button
                        className="header-menu-item item-danger"
                        onClick={() => { setShowClearConfirm(true); setShowHeaderMenu(false) }}
                      >
                        🗑 Clear Chat
                      </button>
                    </div>
                  )}
                </div>
                <span className={`paid-badge ${isCompleted ? 'completed-badge' : ''}`}>
                  {isCompleted ? '✓ Completed' : '✓ Active'}
                </span>
              </div>
            </div>

            {showClearConfirm && (
              <div className="clear-confirm-bar">
                <span>Clear all messages in this chat?</span>
                <button className="clear-confirm-yes" onClick={handleClearChat}>Yes, Clear</button>
                <button className="clear-confirm-no" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              </div>
            )}

            <div className="messages-area" ref={bodyRef}>
              <div className="system-msg">
                {isCompleted
                  ? '🔒 This consultation session is complete.'
                  : '🔓 Consultation accepted — you can now chat'}
              </div>

              {messages.map((msg, i) => {
                const isPatient = msg.sender === 'patient' || msg.from === 'patient'
                const isSystem  = msg.sender === 'system'

                if (isSystem) {
                  return (
                    <div key={msg.id || i} className="system-msg system-msg--alert">
                      {msg.text}
                    </div>
                  )
                }

                if (msg.prescription) {
                  return (
                    <div key={msg.id || i} className="msg-row msg-row--doctor">
                      <div className="msg-content-wrap">
                        <PrescriptionCard rx={msg.prescription} />
                        <p className="timestamp timestamp--left">{msg.time}</p>
                      </div>
                    </div>
                  )
                }

                if (isPatient) {
                  return (
                    <div key={msg.id || i} className="msg-row msg-row--patient">
                      <div className="msg-content-wrap msg-content-wrap--right">
                        {msg.text && (
                          <div className="bubble bubble--patient">
                            {msg.text}
                            {msg.isEdited && <span className="edited-indicator">(edited)</span>}
                          </div>
                        )}
                        <p className="timestamp timestamp--right">{msg.time}</p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id || i} className="msg-row msg-row--doctor">
                    <div className="msg-content-wrap">
                      {msg.text && (
                        <div className="bubble bubble--doctor">{msg.text}</div>
                      )}
                      <p className="timestamp timestamp--left">{msg.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {isCompleted ? (
              <div className="session-completed-banner">
                🔒 This session has been marked as completed. Further messaging is disabled.
              </div>
            ) : (
              <div className="chat-footer">
                <div className="input-row">
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="send-btn" onClick={sendMessage}>➤</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}