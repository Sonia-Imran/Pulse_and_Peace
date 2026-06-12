import { useNavigate } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import { IoIosArrowForward } from 'react-icons/io'
import { useState, useRef, useEffect } from 'react'
import BookingModal from '../../../../Components/BookingModal/BookingModal'
import API from '../../../../api'
import './Banner.css'

export default function Banner() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [results, setResults] = useState({ doctors: [], services: [] })
  const [allDoctors, setAllDoctors] = useState([])
  const [allServices, setAllServices] = useState([])
  const wrapperRef = useRef(null)

  useEffect(() => {
    loadData()
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    try {
      const [docRes, svcRes] = await Promise.all([
        API.get('/doctor/all'),
        API.get('/services/approved'),
      ])
      setAllDoctors(docRes.data.data)
      setAllServices(svcRes.data.data)
    } catch {
      setAllDoctors(JSON.parse(localStorage.getItem('localUsers') || '[]').filter(u => u.role === 'doctor'))
      setAllServices(JSON.parse(localStorage.getItem('localServices') || '[]').filter(s => s.status === 'Approved'))
    }
  }

  const handleSearch = (value) => {
    setSearch(value)
    if (!value.trim()) { setShowDropdown(false); return }
    const q = value.toLowerCase()
    setResults({
      doctors: allDoctors.filter(d => d.fullName?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q)),
      services: allServices.filter(s => (s.serviceName || s.title)?.toLowerCase().includes(q)),
    })
    setShowDropdown(true)
  }

  const handleFocus = () => {
    if (!search.trim()) {
      setResults({ doctors: allDoctors.slice(0, 4), services: allServices.slice(0, 4) })
      setShowDropdown(true)
    }
  }

  const handleDoctorClick = (doc) => {
    setSearch(`Dr. ${doc.fullName}`)
    setShowDropdown(false)
    navigate(`/doctors?search=${doc.fullName}`)
  }

  const handleServiceClick = () => {
    setShowDropdown(false)
    const el = document.getElementById('services')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const hasResults = results.doctors.length > 0 || results.services.length > 0

  return (
    <section className="banner" id="home">
      <div className="banner_content">
        <h1 className="banner_title">Your Health Is Our First Priority</h1>
        <h3 className="banner_subtitle">Get Emotional Support, Guidance, <br /> Professional Care Anytime</h3>
        <h4 className="banner_highlight">You're Not Alone __ We're Here to Listen</h4>
        <p className="banner_description">Talk to AI, connect with doctors, and care for your mental well-being</p>

        <div className="banner_search_wrapper" ref={wrapperRef}>
          <div className="banner_search">
            <input
              type="text"
              placeholder="Search doctors or services..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={handleFocus}
            />
            <button className="search_btn"><FaSearch /></button>
          </div>

          {showDropdown && (
            <div className="search_dropdown">
              {!hasResults ? (
                <div className="search_no_result">No results found for "{search}"</div>
              ) : (
                <>
                  {results.doctors.length > 0 && (
                    <div className="dropdown_section">
                      <span className="dropdown_section_label">Doctors</span>
                      {results.doctors.map(doc => (
                        <div key={doc._id} className="dropdown_item" onClick={() => handleDoctorClick(doc)}>
                          <span className="dropdown_name">Dr. {doc.fullName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.services.length > 0 && (
                    <div className="dropdown_section">
                      <span className="dropdown_section_label">Services</span>
                      {results.services.map(service => (
                        <div key={service._id} className="dropdown_item" onClick={handleServiceClick}>
                          <span className="dropdown_name">{service.serviceName || service.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="banner_buttons">
          <button className="btn_primary" onClick={() => setBookingOpen(true)}>Book Consultation</button>
          <button className="btn_primary" onClick={() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }}>
            See Services <IoIosArrowForward className="icon-btn" />
          </button>
        </div>
      </div>
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </section>
  )
}