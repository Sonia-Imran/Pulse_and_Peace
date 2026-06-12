import { useState, useEffect } from "react";
import "./Doctors.css";
import { FaMedal, FaUserFriends } from "react-icons/fa";
import { IoMdStar } from "react-icons/io";
import { Carousel } from "antd";
import BookingModal from "../../../../Components/BookingModal/BookingModal";

export default function Doctors() {
  const [allDoctors, setAllDoctors]   = useState([])
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  useEffect(() => {
    loadDoctors()
    const interval = setInterval(loadDoctors, 3000)
    window.addEventListener('storage', loadDoctors)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', loadDoctors)
    }
  }, [])

  const loadDoctors = () => {
    const doctors = JSON.parse(localStorage.getItem('localUsers') || '[]')
      .filter(u => u.role === 'doctor')
      .map(d => ({
        id:          d._id,
        fullName:    d.fullName,
        specialty:   d.specialty    || 'General Physician',
        experience:  d.experience   || 'N/A',
        img:         d.avatarUrl    || d.avatar || null,
        rating:      d.rating       || 4.5,
        patients:    d.patients     || '0+',
        education:   d.education    || 'Medical Degree',
        description: d.description  || 'Experienced medical professional dedicated to patient care.',
        phone:       d.phone        || '',
      }))
    setAllDoctors(doctors)
  }

  const handleBooking = (doctor) => {
    setSelectedDoctor(doctor)
    setBookingOpen(true)
  }

  if (allDoctors.length === 0) {
    return (
      <section className="doctor_section" id="doctors">
        <div className="doctor_header_container">
          <h2 className="doctor_main_title">
            Meet Our <span className="highlighted_word">Doctors</span>
          </h2>
          <p className="doctor_subtitle">
            Our team of experienced and compassionate mental health professionals
            is dedicated to guiding you towards your mental wellness.
          </p>
        </div>
        <div className="doctor_empty">
          <div className="doctor_empty_icon">👨‍⚕️</div>
          <p className="doctor_empty_text">No doctors available at the moment.</p>
          <p className="doctor_empty_sub">Please check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="doctor_section" id="doctors">
      <div className="doctor_header_container">
        <h2 className="doctor_main_title">
          Meet Our <span className="highlighted_word">Doctors</span>
        </h2>
        <p className="doctor_subtitle">
          Our team of experienced and compassionate mental health professionals
          is dedicated to guiding you towards your mental wellness.
        </p>
      </div>

      <div className="doctor_container">
        <Carousel autoplay autoplaySpeed={3000} effect="scrollx" dots={true}>
          {allDoctors.map((item) => (
            <div key={item.id}>
              <div className="doctor_card">
                <div className="doctor_img_container">
                  {item.img ? (
                    <img className="doctor_img" src={item.img} alt={item.fullName} />
                  ) : (
                    <div className="doctor_img_placeholder">
                      {item.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="doctor_info">
                  <h3 className="doctor_name">Dr. {item.fullName}</h3>
                  <p className="doctor_specialization">{item.specialty}</p>
                  <div className="doctor_status">
                    <span><FaMedal /> {item.experience}</span>
                    <span><IoMdStar /> {item.rating}</span>
                    <span><FaUserFriends /> {item.patients}</span>
                  </div>
                  <div className="doctor_details">
                    <p><strong>Education:</strong> {item.education}</p>
                    <p>{item.description}</p>
                  </div>
                  <button className="book_butn" onClick={() => handleBooking(item)}>
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preSelectedDoctor={selectedDoctor}
      />
    </section>
  )
}
