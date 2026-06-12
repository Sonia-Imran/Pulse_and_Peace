import { useState } from 'react'
import { Modal, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import API from '../../api'
import './PaymentModal.css'

export const PaymentModal = ({ visible, appointmentData, onClose, onPaymentSuccess }) => {
  const [step, setStep]           = useState('select')
  const [method, setMethod]       = useState(null)
  const [phone, setPhone]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  if (!appointmentData) return null

  const fee          = Number(appointmentData.fee) || 500
  const adminCut     = Math.round(fee * 0.10)
  const doctorShare  = Math.round(fee * 0.90)

  const handleMethodSelect = (m) => {
    setMethod(m)
    setStep('enter')
  }

 const handlePay = async () => {
  if (!phone.trim() || phone.length < 10) {
    message.warning('Please enter a valid phone number')
    return
  }
  setLoading(true)
  try {
    await API.post('/payment/pay', {
      bookingId: appointmentData.id,
      method,
      phone: `+92${phone}`,
    })
    setSuccess(true)
    setStep('success')
  } catch (err) {
    message.error(err.response?.data?.message || 'Payment failed. Try again.')
  } finally {
    setLoading(false)
  }
}

  const handleClose = () => {
    if (success) onPaymentSuccess()
    else onClose()
    setStep('select')
    setMethod(null)
    setPhone('')
    setSuccess(false)
  }

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      centered
      width={420}
      className="pay-modal"
      closable={!loading}
    >
      {step === 'select' && (
        <div className="pay-modal-inner">
          <div className="pay-modal-header">
            <div className="pay-lock-icon">🔒</div>
            <h3 className="pay-modal-title">Complete Payment</h3>
            <p className="pay-modal-sub">Choose your payment method to unlock consultation</p>
          </div>

          <div className="pay-summary">
            <div className="pay-summary-row">
              <span>Service</span>
              <span>{appointmentData.type || 'Consultation'}</span>
            </div>
            <div className="pay-summary-row">
              <span>Doctor</span>
              <span>{appointmentData.doctorName ? `Dr. ${appointmentData.doctorName}` : 'Doctor'}</span>
            </div>
            <div className="pay-summary-row">
              <span>Date</span>
              <span>{appointmentData.date || 'N/A'}</span>
            </div>
            <div className="pay-summary-divider" />
            <div className="pay-summary-row pay-total-row">
              <span>Total Amount</span>
              <span className="pay-total-amount">Rs. {fee}</span>
            </div>
            <div className="pay-split-row">
              <span className="pay-split-doctor">Doctor: Rs. {doctorShare} (90%)</span>
              <span className="pay-split-platform">Platform: Rs. {adminCut} (10%)</span>
            </div>
          </div>

          <p className="pay-method-label">Select Payment Method</p>
          <div className="pay-methods-grid">
            <button className="pay-method-card" onClick={() => handleMethodSelect('jazzcash')}>
              <div className="pay-method-logo pay-jc-logo">
                <span className="pay-method-emoji">📱</span>
                <span className="pay-method-name">JazzCash</span>
              </div>
              <span className="pay-method-sub">Mobile Account</span>
            </button>
            <button className="pay-method-card" onClick={() => handleMethodSelect('easypaisa')}>
              <div className="pay-method-logo pay-ep-logo">
                <span className="pay-method-emoji">💚</span>
                <span className="pay-method-name">EasyPaisa</span>
              </div>
              <span className="pay-method-sub">Mobile Account</span>
            </button>
          </div>

          <button className="pay-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      )}

      {step === 'enter' && (
        <div className="pay-modal-inner">
          <button className="pay-back-btn" onClick={() => setStep('select')}>← Back</button>

          <div className="pay-method-header">
            <div className={`pay-method-badge ${method === 'jazzcash' ? 'pay-badge-jc' : 'pay-badge-ep'}`}>
              {method === 'jazzcash' ? '📱 JazzCash' : '💚 EasyPaisa'}
            </div>
            <h3 className="pay-enter-title">Enter Your Mobile Number</h3>
            <p className="pay-enter-sub">
              We will send a payment request to your {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} account
            </p>
          </div>

          <div className="pay-phone-field">
            <label className="pay-phone-label">Mobile Number</label>
            <div className="pay-phone-input-wrap">
              <span className="pay-phone-prefix">+92</span>
              <input
                className="pay-phone-input"
                type="tel"
                placeholder="3XX XXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
            </div>
            <p className="pay-phone-hint">
              Enter the number linked to your {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} account
            </p>
          </div>

          <div className="pay-amount-display">
            <span className="pay-amount-label">Amount to Pay</span>
            <span className="pay-amount-value">Rs. {fee}</span>
          </div>

          <button
            className="pay-proceed-btn"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? (
              <span className="pay-loading">
                <span className="pay-spinner" /> Processing...
              </span>
            ) : (
              `Pay Rs. ${fee} via ${method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}`
            )}
          </button>

          <p className="pay-secure-note">🔒 Your payment is secure and encrypted</p>
        </div>
      )}

      {step === 'success' && (
        <div className="pay-modal-inner pay-success-inner">
          <div className="pay-success-icon">
            <CheckCircleOutlined />
          </div>
          <h3 className="pay-success-title">Payment Successful!</h3>
          <p className="pay-success-sub">
            Rs. {fee} paid via {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
          </p>

          <div className="pay-success-details">
            <div className="pay-success-row">
              <span>Service</span>
              <span>{appointmentData.type || 'Consultation'}</span>
            </div>
            <div className="pay-success-row">
              <span>Amount Paid</span>
              <span className="pay-success-green">Rs. {fee}</span>
            </div>
            <div className="pay-success-row">
              <span>Method</span>
              <span>{method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}</span>
            </div>
            <div className="pay-success-row">
              <span>Status</span>
              <span className="pay-success-green">✓ Confirmed</span>
            </div>
          </div>

          <div className="pay-unlock-banner">
            🔓 Your consultation chat is now unlocked!
          </div>

          <button className="pay-proceed-btn" onClick={handleClose}>
            Go to Chat
          </button>
        </div>
      )}
    </Modal>
  )
}