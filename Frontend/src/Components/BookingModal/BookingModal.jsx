import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Steps, DatePicker, TimePicker, Input, Button, message, Avatar } from "antd"
import { RobotOutlined, UserOutlined, CheckCircleOutlined, MedicineBoxOutlined, MessageOutlined } from "@ant-design/icons"
import API from "../../api"
import "./BookingModal.css"

const { TextArea } = Input

const BookingModal = ({ open, onClose, preSelectedDoctor, preSelectedService }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [consultType, setConsultType] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [concern, setConcern] = useState("")
  const [loading, setLoading] = useState(false)
  const [approvedServices, setApprovedServices] = useState([])
  const [doctors, setDoctors] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [servRes, docRes] = await Promise.all([
        API.get("/services/approved"),
        API.get("/doctor/all"),
      ])
      setApprovedServices(servRes.data.data.map((s) => ({ name: s.serviceName, fee: s.baseFee, id: s._id })))
      setDoctors(docRes.data.data)
    } catch {
      const local = JSON.parse(localStorage.getItem("localServices") || "[]").filter((s) => s.status === "Approved")
      setApprovedServices(local.map((s) => ({ name: s.serviceName, fee: s.baseFee, id: s._id })))
      setDoctors(JSON.parse(localStorage.getItem("localUsers") || "[]").filter((u) => u.role === "doctor"))
    }
  }

  const resetAll = () => {
    setCurrentStep(0); setConsultType(null); setSelectedService(null)
    setSelectedDoctor(null); setSelectedDate(null); setSelectedTime(null); setConcern("")
  }

  const handleClose = () => { resetAll(); onClose() }

  const handleTypeSelect = (type) => { setConsultType(type); setCurrentStep(1) }

  const handleNext = () => {
    if (currentStep === 1 && !selectedService) { message.warning("Please select a service"); return }
    if (currentStep === 2) {
      if (consultType === "doctor" && !selectedDoctor) { message.warning("Please select a doctor"); return }
      if (!selectedDate || !selectedTime) { message.warning("Please select date and time"); return }
    }
    setCurrentStep((prev) => prev + 1)
  }

const handleSubmit = async () => {
  if (!concern.trim()) { message.warning('Please describe your concern'); return }
  setLoading(true)

  try {
    const token = localStorage.getItem('user-token')
    const patientProfile = JSON.parse(localStorage.getItem('patient_profile') || '{}')

    const matchedService   = approvedServices.find(s => s.name === selectedService?.name)
    const calculatedFee    = matchedService?.fee ? Number(matchedService.fee) : 0
    const matchedDoctorObj = doctors.find(d => String(d._id) === String(selectedDoctor))

    const bookingPayload = {
      doctorId:    selectedDoctor || null,
      serviceId:   matchedService?.id || null,
      type:        selectedService?.name || selectedService,
      consultType,
      date:        selectedDate?.format('YYYY-MM-DD'),
      time:        selectedTime?.format('HH:mm'),
      reason:      concern,
      fee:         calculatedFee,
    }

    let booking

    if (token) {
      const { data } = await API.post('/booking', bookingPayload)
      booking = {
        id:            String(data.data._id),
        patient:       patientProfile.fullName || 'Patient',
        patientId:     patientProfile._id,
        type:          bookingPayload.type,
        consultType,
        doctorId:      selectedDoctor,
        doctorName:    matchedDoctorObj?.fullName || '',
        fee:           calculatedFee,
        paymentStatus: 'unpaid',
        date:          bookingPayload.date,
        time:          bookingPayload.time,
        reason:        concern,
        status:        'pending',
      }
    } else {
      booking = {
        id:            Date.now().toString(),
        patient:       patientProfile.fullName || 'Patient',
        patientName:   patientProfile.fullName || 'Patient',
        patientId:     patientProfile._id,
        type:          bookingPayload.type,
        consultType,
        doctorId:      selectedDoctor,
        doctorName:    matchedDoctorObj?.fullName || '',
        fee:           calculatedFee,
        paymentStatus: 'unpaid',
        date:          bookingPayload.date,
        time:          bookingPayload.time,
        reason:        concern,
        status:        'pending',
        createdAt:     new Date().toISOString(),
      }
      const appointments = JSON.parse(localStorage.getItem('pp_appointments') || '[]')
      appointments.push(booking)
      localStorage.setItem('pp_appointments', JSON.stringify(appointments))
    }

    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
    userBookings.push(booking)
    localStorage.setItem('userBookings', JSON.stringify(userBookings))

    window.dispatchEvent(new Event('new-appointment'))
    setLoading(false)
    setCurrentStep(3)
  } catch (err) {
    message.error(err.response?.data?.message || 'Failed to book. Try again.')
    setLoading(false)
  }
}

  useEffect(() => {
    if (preSelectedDoctor) { setSelectedDoctor(preSelectedDoctor.id); setConsultType("doctor"); setCurrentStep(1) }
  }, [preSelectedDoctor, open])

  useEffect(() => {
    if (preSelectedService) { setSelectedService({ name: preSelectedService }); setCurrentStep(2); setConsultType("doctor") }
  }, [preSelectedService, open])

  const steps = [{ title: "Type" }, { title: "Service" }, { title: "Schedule" }, { title: "Done" }]

  return (
    <Modal open={open} onCancel={handleClose} footer={null} width={560} className="booking-modal" centered destroyOnClose>
      <div className="bm-header">
        <h2 className="bm-title">Book Consultation</h2>
        <p className="bm-subtitle">Get professional mental health support</p>
      </div>
      <Steps current={currentStep} items={steps} className="bm-steps" size="small" />
      <div className="bm-content">
        {currentStep === 0 && (
          <div className="bm-step">
            <h3 className="bm-step-title">How would you like to consult?</h3>
            <div className="bm-type-grid">
              <div className={`bm-type-card ${consultType === "ai" ? "selected" : ""}`} onClick={() => handleTypeSelect("ai")}>
                <div className="bm-type-icon bm-type-icon-ai"><RobotOutlined /></div>
                <h4 className="bm-type-name">Chat with AI</h4>
                <p className="bm-type-desc">Get instant support from our AI assistant. Available 24/7.</p>
                <div className="bm-type-badge bm-type-badge-ai">Free • Instant</div>
              </div>
              <div className={`bm-type-card ${consultType === "doctor" ? "selected" : ""}`} onClick={() => handleTypeSelect("doctor")}>
                <div className="bm-type-icon bm-type-icon-doctor"><UserOutlined /></div>
                <h4 className="bm-type-name">Chat with Doctor</h4>
                <p className="bm-type-desc">Connect with a licensed professional for personalized guidance.</p>
                <div className="bm-type-badge bm-type-badge-doctor">Professional • Paid</div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="bm-step">
            <h3 className="bm-step-title">Select a Service</h3>
            <div className="bm-services-grid">
              {approvedServices.length === 0 ? (
                <p className="bm-no-services">No approved services available</p>
              ) : (
                approvedServices.map((service) => (
                  <div key={service.id} className={`bm-service-item ${selectedService?.name === service.name ? "selected" : ""}`} onClick={() => setSelectedService(service)}>
                    <MedicineBoxOutlined className="bm-service-icon" />
                    <span className="bm-service-name">{service.name}</span>
                    {service.fee > 0 && <span className="bm-service-fee">Rs. {service.fee}</span>}
                    {selectedService?.name === service.name && <CheckCircleOutlined className="bm-service-check" />}
                  </div>
                ))
              )}
            </div>
            <div className="bm-footer-btns">
              <Button className="bm-back-btn" onClick={() => setCurrentStep(0)}>Back</Button>
              <Button className="bm-next-btn" onClick={handleNext}>Next</Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bm-step">
            <h3 className="bm-step-title">Schedule Your Session</h3>
            {consultType === "doctor" && (
              <div className="bm-field">
                <label className="bm-label">Select Doctor</label>
                <div className="bm-doctors-list">
                  {doctors.length === 0 ? (
                    <p className="bm-no-doctors">No doctors available</p>
                  ) : (
                    doctors.map((doc) => (
                      <div key={doc._id} className={`bm-doctor-item ${selectedDoctor === doc._id ? "selected" : ""}`} onClick={() => setSelectedDoctor(doc._id)}>
                        <Avatar size={40} icon={<UserOutlined />} className="bm-doc-avatar" />
                        <div className="bm-doc-info">
                          <span className="bm-doc-name">Dr. {doc.fullName}</span>
                          <span className="bm-doc-spec">{doc.specialty || "General Physician"}</span>
                        </div>
                        {selectedDoctor === doc._id && <CheckCircleOutlined className="bm-doc-check" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {consultType === "ai" && (
              <div className="bm-ai-note">
                <RobotOutlined className="bm-ai-note-icon" />
                <div>
                  <p className="bm-ai-note-title">AI Assistant is always available</p>
                  <p className="bm-ai-note-sub">Schedule a preferred time or start immediately</p>
                </div>
              </div>
            )}
            <div className="bm-date-time">
              <div className="bm-field">
                <label className="bm-label">Select Date</label>
                <DatePicker className="bm-datepicker" onChange={setSelectedDate} placeholder="Choose date" />
              </div>
              <div className="bm-field">
                <label className="bm-label">Select Time</label>
                <TimePicker className="bm-timepicker" onChange={setSelectedTime} format="HH:mm" placeholder="Choose time" />
              </div>
            </div>
            <div className="bm-field">
              <label className="bm-label">Describe Your Concern</label>
              <TextArea className="bm-textarea" rows={3} placeholder="Briefly describe what you'd like help with..." value={concern} onChange={(e) => setConcern(e.target.value)} />
            </div>
            <div className="bm-footer-btns">
              <Button className="bm-back-btn" onClick={() => setCurrentStep(1)}>Back</Button>
              <Button className="bm-next-btn" onClick={handleSubmit} loading={loading}>
                {consultType === "ai" ? "Start Chat" : "Send Request"}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bm-success">
            <div className="bm-success-icon"><CheckCircleOutlined /></div>
            <h3 className="bm-success-title">{consultType === "ai" ? "AI Chat Ready!" : "Request Sent!"}</h3>
            <p className="bm-success-desc">
              {consultType === "ai" ? "Your AI consultation is ready. Click below to start." : "Request sent! Once doctor approves and you pay, chat will unlock."}
            </p>
            <div className="bm-success-details">
              <div className="bm-success-row"><span className="bm-success-label">Service</span><span className="bm-success-value">{selectedService?.name}</span></div>
              <div className="bm-success-row"><span className="bm-success-label">Type</span><span className="bm-success-value">{consultType === "ai" ? "AI Chat" : "Doctor Consultation"}</span></div>
              {selectedDate && <div className="bm-success-row"><span className="bm-success-label">Date</span><span className="bm-success-value">{selectedDate?.format("DD MMM YYYY")}</span></div>}
              {selectedTime && <div className="bm-success-row"><span className="bm-success-label">Time</span><span className="bm-success-value">{selectedTime?.format("HH:mm")}</span></div>}
            </div>
            <div className="bm-success-btns">
              {consultType === "ai" ? (
                <Button className="bm-start-btn" icon={<MessageOutlined />} onClick={() => { handleClose(); window.dispatchEvent(new Event("openChatbot")) }}>Start AI Chat</Button>
              ) : (
                <Button className="bm-start-btn" onClick={() => { handleClose(); navigate("/my-appointments") }}>View My Appointments</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BookingModal