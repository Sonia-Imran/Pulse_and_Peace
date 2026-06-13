import { useState, useEffect, useRef } from 'react'
import { Badge } from 'antd'
import {
  RobotOutlined, CloseOutlined, SendOutlined,
  UserOutlined, CustomerServiceOutlined, MinusOutlined,
} from '@ant-design/icons'
import BookingModal from '../BookingModal/BookingModal'
import API from '../../api'
import './Chatbot.css'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your Pulse & Peace AI assistant. How are you feeling today? I'm here to listen and support you. 💙",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [remaining, setRemaining] = useState(null)
  const [limitReached, setLimitReached] = useState(false)
  const [showDoctorPrompt, setShowDoctorPrompt] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      setTimeout(() => inputRef.current?.focus(), 100)
      loadUsage()
    }
  }, [isOpen])

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setIsMinimized(false)
    }
    window.addEventListener('openChatbot', handleOpen)
    return () => window.removeEventListener('openChatbot', handleOpen)
  }, [])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  const loadUsage = async () => {
    try {
      const { data } = await API.get('/chatbot/usage')
      setRemaining(data.data.remaining)
      setLimitReached(data.data.remaining <= 0)
    } catch {}
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || limitReached) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const conversationHistory = [
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ]

      const { data } = await API.post('/chatbot', { messages: conversationHistory })

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCrisis: data.isCrisis,
      }])

      setRemaining(data.remaining)
      if (data.remaining <= 0) setLimitReached(true)
      if (data.isCrisis) setShowDoctorPrompt(true)

      if (!isOpen) setUnreadCount(prev => prev + 1)

    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.limitReached) {
        setLimitReached(true)
        setRemaining(0)
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: err.response.data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I'm here to support you. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRealDoctor = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setShowDoctorPrompt(false)
    setBookingOpen(true)
  }

  const clearChat = () => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your Pulse & Peace AI assistant. How are you feeling today? 💙",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
    setShowDoctorPrompt(false)
  }

  return (
    <>
      <div className="chatbot-wrapper">
        {isOpen && (
          <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
            <div className="chatbot-header">
              <div className="chatbot-header-left">
                <div className="chatbot-avatar">
                  <RobotOutlined className="chatbot-avatar-icon" />
                  <span className="chatbot-online-dot" />
                </div>
                <div className="chatbot-header-info">
                  <span className="chatbot-name">Pulse AI Assistant</span>
                  <span className="chatbot-status">
                    {remaining !== null ? `${remaining} messages left today` : 'Online • Always here for you'}
                  </span>
                </div>
              </div>
              <div className="chatbot-header-actions">
                <button className="chatbot-action-btn" onClick={() => setIsMinimized(prev => !prev)}>
                  <MinusOutlined />
                </button>
                <button className="chatbot-action-btn" onClick={() => setIsOpen(false)}>
                  <CloseOutlined />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="chatbot-messages">
                  {messages.map(msg => (
                    <div key={msg.id} className={`chatbot-msg ${msg.role === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-ai'}`}>
                      {msg.role === 'assistant' && (
                        <div className="chatbot-msg-avatar"><RobotOutlined /></div>
                      )}
                      <div className={`chatbot-bubble ${msg.isCrisis ? 'chatbot-bubble-crisis' : ''}`}>
                        <p className="chatbot-bubble-text">{msg.content}</p>
                        <span className="chatbot-bubble-time">{msg.time}</span>
                      </div>
                      {msg.role === 'user' && (
                        <div className="chatbot-msg-avatar chatbot-msg-avatar-user"><UserOutlined /></div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="chatbot-msg chatbot-msg-ai">
                      <div className="chatbot-msg-avatar"><RobotOutlined /></div>
                      <div className="chatbot-bubble chatbot-typing">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  )}

                  {showDoctorPrompt && (
                    <div className="chatbot-crisis-action">
                      <button className="chatbot-crisis-btn" onClick={handleRealDoctor}>
                        <CustomerServiceOutlined /> Talk to a Real Doctor Now
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-doctor-banner">
                  <CustomerServiceOutlined className="chatbot-doctor-icon" />
                  <div className="chatbot-doctor-text">
                    <span className="chatbot-doctor-title">Need a real doctor?</span>
                    <span className="chatbot-doctor-sub">Connect with a licensed professional</span>
                  </div>
                  <button className="chatbot-doctor-btn" onClick={handleRealDoctor}>
                    Chat Now
                  </button>
                </div>

                {limitReached && (
                  <div className="chatbot-limit-banner">
                    Daily limit reached. Connect with a real doctor for further support.
                  </div>
                )}

                <div className="chatbot-input-area">
                  <textarea
                    ref={inputRef}
                    className="chatbot-input"
                    placeholder={limitReached ? "Daily limit reached..." : "Share how you're feeling..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={limitReached}
                  />
                  <button
                    className={`chatbot-send-btn ${input.trim() && !limitReached ? 'active' : ''}`}
                    onClick={sendMessage}
                    disabled={!input.trim() || loading || limitReached}
                  >
                    <SendOutlined />
                  </button>
                </div>

                <div className="chatbot-footer">
                  <span className="chatbot-footer-text">Powered by Llama 3.3</span>
                  <button className="chatbot-clear-btn" onClick={clearChat}>Clear chat</button>
                </div>
              </>
            )}
          </div>
        )}

        <button className="chatbot-fab" onClick={() => setIsOpen(prev => !prev)}>
          <Badge count={unreadCount} size="small" offset={[-4, 4]}>
            {isOpen ? <CloseOutlined className="fab-icon" /> : <RobotOutlined className="fab-icon" />}
          </Badge>
          {!isOpen && <span className="fab-pulse" />}
        </button>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preSelectedService={null}
      />
    </>
  )
}

export default Chatbot