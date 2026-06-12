import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, XCircle, CreditCard, MessageSquare, RefreshCw, AlertCircle, Trash2 } from 'lucide-react'
import Header from '../../../Components/Header/Header'
import Footer from '../../../Components/Footer/Footer'
import { PaymentModal } from '../../../Components/PaymentModal/PaymentModal'
import API from '../../../api'
import './MyAppointments.css'

export default function MyAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedAppt, setSelectedAppt]  = useState(null)
  const [showPayModal, setShowPayModal]   = useState(false)
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
  load()
  
  const token = localStorage.getItem('user-token')
  if (token) {
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:5000')
      socket.on('appointment_updated', () => {
        load()
      })
      return () => socket.disconnect()
    })
  }

  const interval = setInterval(load, 10000)
  return () => clearInterval(interval)
}, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/patient/appointments')
      setAppointments(data.data || [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const deleteAppointment = async (id) => {
    if (!window.confirm('Delete this appointment?')) return
    try {
      await API.delete(`/booking/${id}`)
    } catch {}
    load()
  }

  const handlePaid = () => {
    setShowPayModal(false)
    load()
    navigate(`/consultation/${selectedAppt.id}`)
  }

  const statusConfig = {
    pending:   { color: '#d97706', bg: '#fffbeb', icon: <Clock size={13} />,        label: 'Pending'   },
    accepted:  { color: '#0d9488', bg: '#f0fdfa', icon: <CheckCircle size={13} />,  label: 'Approved'  },
    completed: { color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle size={13} />,  label: 'Completed' },
    rejected:  { color: '#dc2626', bg: '#fef2f2', icon: <XCircle size={13} />,      label: 'Rejected'  },
  }

  const FILTERS = [
    { key: 'all',       label: 'All Appointments', count: appointments.length },
    { key: 'pending',   label: 'Pending',           count: appointments.filter(a => a.status === 'pending').length },
    { key: 'accepted',  label: 'Approved',          count: appointments.filter(a => a.status === 'accepted').length },
    { key: 'completed', label: 'Completed',         count: appointments.filter(a => a.status === 'completed').length },
    { key: 'rejected',  label: 'Rejected',          count: appointments.filter(a => a.status === 'rejected').length },
  ]

  const filtered = appointments.filter(a => activeFilter === 'all' || a.status === activeFilter)

  return (
    <>
      <Header />
      <div className="ma-root">
        <div className="ma-blob ma-blob-1" />
        <div className="ma-blob ma-blob-2" />
        <div className="ma-wrapper">

          <div className="ma-main-header">
            <div>
              <h2 className="ma-main-title">My Appointments</h2>
              <p className="ma-main-sub">Track and manage your consultation bookings</p>
            </div>
            <button className="ma-refresh-btn" onClick={load} disabled={loading}>
              <RefreshCw size={15} /> {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="ma-tabs">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`ma-tab-btn ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <span>{f.label}</span>
                <span className="ma-tab-count">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="ma-table-container">
            {filtered.length === 0 ? (
              <div className="ma-empty">
                <Calendar size={48} />
                <p>No appointments found</p>
                <button className="ma-book-btn" onClick={() => navigate('/')}>
                  Book a Consultation
                </button>
              </div>
            ) : (
              <table className="ma-table">
                <thead>
                  <tr>
                    <th>Service / Type</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((appt, i) => {
                    const s    = statusConfig[appt.status] || statusConfig.pending
                    const paid = appt.paymentStatus === 'paid'
                    const fee  = Number(appt.fee) || 0

                    return (
                      <tr key={appt.id || i}>
                        <td>
                          <div className="ma-table-service">
                            <div className="ma-table-avatar">
                              {(appt.type || 'C')[0].toUpperCase()}
                            </div>
                            <span className="ma-table-type-text">{appt.type || 'Consultation'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ma-table-datetime">
                            <span><Calendar size={12} /> {appt.date || 'N/A'}</span>
                            <span><Clock size={12} /> {appt.time || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ma-table-reason-text">{appt.reason || '—'}</span>
                        </td>
                        <td>
                          {fee > 0 ? (
                            <div className="ma-table-fee-wrap">
                              <span className="ma-table-fee-amount">Rs. {fee}</span>
                              {appt.status === 'accepted' && (
                                <span className={paid ? 'ma-paid-tag' : 'ma-unpaid-tag'}>
                                  {paid ? 'Paid' : 'Unpaid'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="ma-table-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="ma-table-status-chip"
                            style={{ color: s.color, background: s.bg }}
                          >
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td>
                          {appt.status === 'accepted' && !paid && (
                            <button
                              className="ma-table-action-pay"
                              onClick={() => { setSelectedAppt(appt); setShowPayModal(true) }}
                            >
                              <CreditCard size={13} /> Pay Now
                            </button>
                          )}
                          {appt.status === 'accepted' && paid && (
                            <button
                              className="ma-table-action-chat"
                              onClick={() => navigate(`/consultation/${appt.id}`)}
                            >
                              <MessageSquare size={13} /> Chat
                            </button>
                          )}
                          {appt.status === 'completed' && (
                            <button
                              className="ma-table-action-delete"
                              onClick={() => deleteAppointment(appt.id)}
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                          {appt.status === 'pending' && (
                            <span className="ma-table-action-waiting">
                              <AlertCircle size={13} /> Pending
                            </span>
                          )}
                          {appt.status === 'rejected' && (
                            <span style={{ color: '#dc2626', fontSize: '12px' }}>Rejected</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showPayModal && selectedAppt && (
        <PaymentModal
          visible={showPayModal}
          appointmentData={selectedAppt}
          onClose={() => setShowPayModal(false)}
          onPaymentSuccess={handlePaid}
        />
      )}
      <Footer />
    </>
  )
}