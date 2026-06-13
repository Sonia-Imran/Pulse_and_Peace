import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Rate, Input, Button, message } from "antd"
import { Calendar, Clock, CheckCircle, XCircle, CreditCard, MessageSquare, RefreshCw, AlertCircle, Trash2, Star } from "lucide-react"
import Header from "../../../Components/Header/Header"
import Footer from "../../../Components/Footer/Footer"
import API from "../../../api"
import "./MyAppointments.css"

const { TextArea } = Input

function PaymentModal({ appointment, onPaid, onClose }) {
  const [paying, setPaying] = useState(false)
  const fee = Number(appointment?.fee) || 500

  const handlePay = async () => {
    setPaying(true)
    try {
      await API.post("/payment/pay", { bookingId: appointment.id, method: "simulated" })
      onPaid()
    } catch (err) {
      message.error(err.response?.data?.message || "Payment failed")
      setPaying(false)
    }
  }

  return (
    <div className="ma-pay-overlay" onClick={onClose}>
      <div className="ma-pay-modal" onClick={e => e.stopPropagation()}>
        <div className="ma-pay-header">
          <div className="ma-pay-lock">🔒</div>
          <h3 className="ma-pay-title">Complete Payment</h3>
          <p className="ma-pay-sub">Unlock your consultation chat after payment</p>
        </div>
        <div className="ma-pay-body">
          <div className="ma-pay-row"><span>Service</span><span>{appointment?.type || "Consultation"}</span></div>
          <div className="ma-pay-row"><span>Doctor</span><span>{appointment?.doctorName ? `Dr. ${appointment.doctorName}` : "Doctor"}</span></div>
          <div className="ma-pay-row"><span>Date</span><span>{appointment?.date || "N/A"}</span></div>
          <div className="ma-pay-divider" />
          <div className="ma-pay-row"><span>Total</span><span className="ma-pay-amount">Rs. {fee}</span></div>
          <div className="ma-pay-split">
            <span className="ma-pay-split-doctor">Doctor: Rs. {(fee * 0.90).toFixed(0)} (90%)</span>
            <span className="ma-pay-split-platform">Platform: Rs. {(fee * 0.10).toFixed(0)} (10%)</span>
          </div>
        </div>
        <div className="ma-pay-actions">
          <button className="ma-pay-btn" onClick={handlePay} disabled={paying}>
            {paying ? "Processing..." : `Pay Rs. ${fee}`}
          </button>
          <button className="ma-pay-later" onClick={onClose}>Pay Later</button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ appointment, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) { message.warning("Please select a rating"); return }
    setSubmitting(true)
    try {
      await API.post("/reviews", { bookingId: appointment.id, rating, comment })
      message.success("Review submitted successfully!")
      onSubmitted()
      onClose()
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={`Rate Dr. ${appointment?.doctorName || "Doctor"}`}
      open
      onCancel={onClose}
      footer={null}
      centered
      width={420}
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <p style={{ color: "#8c8c8c", marginBottom: 12 }}>How was your consultation experience?</p>
        <Rate value={rating} onChange={setRating} style={{ fontSize: 28 }} />
      </div>
      <TextArea
        rows={3}
        placeholder="Share your experience (optional)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ marginTop: 12 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>Submit Review</Button>
      </div>
    </Modal>
  )
}

export default function MyAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAppt, setReviewAppt] = useState(null)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await API.get("/patient/appointments")
      const appts = data.data || []
      setAppointments(appts)
      const completed = appts.filter(a => a.status === "completed").map(a => a.id)
      if (completed.length > 0) {
        const reviewed = new Set()
        await Promise.all(
          completed.map(async id => {
            try {
              const { data: rd } = await API.get(`/reviews/check/${id}`)
              if (rd.exists) reviewed.add(id)
            } catch {}
          })
        )
        setReviewedIds(reviewed)
      }
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const deleteAppointment = async (id) => {
    if (!window.confirm("Delete this appointment?")) return
    try {
      await API.delete(`/booking/${id}`)
      load()
    } catch { load() }
  }

  const handlePaid = () => {
    setShowPayModal(false)
    load()
    navigate(`/consultation/${selectedAppt.id}`)
  }

  const statusConfig = {
    pending:   { color: "#d97706", bg: "#fffbeb", icon: <Clock size={13} />,        label: "Pending"   },
    accepted:  { color: "#0d9488", bg: "#f0fdfa", icon: <CheckCircle size={13} />,  label: "Approved"  },
    completed: { color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={13} />,  label: "Completed" },
    rejected:  { color: "#dc2626", bg: "#fef2f2", icon: <XCircle size={13} />,      label: "Rejected"  },
  }

  const FILTERS = [
    { key: "all",       label: "All Appointments", count: appointments.length },
    { key: "pending",   label: "Pending",           count: appointments.filter(a => a.status === "pending").length },
    { key: "accepted",  label: "Approved",          count: appointments.filter(a => a.status === "accepted").length },
    { key: "completed", label: "Completed",         count: appointments.filter(a => a.status === "completed").length },
    { key: "rejected",  label: "Rejected",          count: appointments.filter(a => a.status === "rejected").length },
  ]

  const filtered = appointments.filter(a => activeFilter === "all" || a.status === activeFilter)

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
              <RefreshCw size={15} /> {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="ma-tabs">
            {FILTERS.map(f => (
              <button key={f.key} className={`ma-tab-btn ${activeFilter === f.key ? "active" : ""}`} onClick={() => setActiveFilter(f.key)}>
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
                <button className="ma-book-btn" onClick={() => navigate("/")}>Book a Consultation</button>
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
                    const s = statusConfig[appt.status] || statusConfig.pending
                    const paid = appt.paymentStatus === "paid"
                    const hasReviewed = reviewedIds.has(appt.id)
                    return (
                      <tr key={appt.id || i}>
                        <td>
                          <div className="ma-table-service">
                            <div className="ma-table-avatar">{(appt.type || "C")[0].toUpperCase()}</div>
                            <span className="ma-table-type-text">{appt.type || "Consultation"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ma-table-datetime">
                            <span><Calendar size={12} /> {appt.date || "N/A"}</span>
                            <span><Clock size={12} /> {appt.time || "N/A"}</span>
                          </div>
                        </td>
                        <td><span className="ma-table-reason-text">{appt.reason || "—"}</span></td>
                        <td>
                          {appt.fee > 0 ? (
                            <div className="ma-table-fee-wrap">
                              <span className="ma-table-fee-amount">Rs. {appt.fee}</span>
                              {appt.status === "accepted" && (
                                <span className={paid ? "ma-paid-tag" : "ma-unpaid-tag"}>{paid ? "Paid" : "Unpaid"}</span>
                              )}
                            </div>
                          ) : <span className="ma-table-muted">—</span>}
                        </td>
                        <td>
                          <span className="ma-table-status-chip" style={{ color: s.color, background: s.bg }}>
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td>
                          {appt.status === "accepted" && !paid && (
                            <button className="ma-table-action-pay" onClick={() => { setSelectedAppt(appt); setShowPayModal(true) }}>
                              <CreditCard size={13} /> Pay Now
                            </button>
                          )}
                          {appt.status === "accepted" && paid && (
                            <button className="ma-table-action-chat" onClick={() => navigate(`/consultation/${appt.id}`)}>
                              <MessageSquare size={13} /> Chat
                            </button>
                          )}
                          {appt.status === "completed" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              {!hasReviewed ? (
                                <button
                                  className="ma-table-action-chat"
                                  onClick={() => { setReviewAppt(appt); setShowReviewModal(true) }}
                                  style={{ background: "#faad14", borderColor: "#faad14" }}
                                >
                                  <Star size={13} /> Review
                                </button>
                              ) : (
                                <span className="ma-paid-tag">✓ Reviewed</span>
                              )}
                              <button className="ma-table-action-delete" onClick={() => deleteAppointment(appt.id)} title="Delete">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                          {appt.status === "pending" && (
                            <span className="ma-table-action-waiting"><AlertCircle size={13} /> Pending</span>
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
        <PaymentModal appointment={selectedAppt} onPaid={handlePaid} onClose={() => setShowPayModal(false)} />
      )}
      {showReviewModal && reviewAppt && (
        <ReviewModal appointment={reviewAppt} onClose={() => setShowReviewModal(false)} onSubmitted={load} />
      )}
      <Footer />
    </>
  )
}