import { useState, useEffect } from 'react'
import { FaBrain, FaUsers } from 'react-icons/fa6'
import { GoHeartFill } from 'react-icons/go'
import { IoSparklesSharp } from 'react-icons/io5'
import { MdOutlineMedicalServices } from 'react-icons/md'
import { FaClock, FaRupeeSign } from 'react-icons/fa'
import { Button, Empty } from 'antd'
import BookingModal from '../../../../Components/BookingModal/BookingModal'
import API from '../../../../api'
import './Services.css'

const getIcon = (category) => {
  if (category === 'Therapy')    return <FaUsers />
  if (category === 'Cardiology') return <GoHeartFill />
  if (category === 'General')    return <FaBrain />
  if (category === 'Nutrition')  return <IoSparklesSharp />
  return <MdOutlineMedicalServices />
}

export default function Services() {
  const [servicesData, setServicesData]       = useState([])
  const [bookingOpen, setBookingOpen]         = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  useEffect(() => { loadServices() }, [])

  const loadServices = async () => {
    try {
      const { data } = await API.get('/services/approved')
      const mapped = data.data.map(s => ({
        id:           s._id,
        img:          s.image || 'https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80',
        icon:         getIcon(s.category),
        title:        s.serviceName,
        providerName: s.providerName || '',
        baseFee:      s.baseFee      || 0,
        duration:     s.duration     || 'N/A',
        description:  s.description  || '',
        category:     s.category     || 'General',
      }))
      setServicesData(mapped)
      localStorage.setItem('localServices', JSON.stringify(data.data))
    } catch {
      const local = JSON.parse(localStorage.getItem('localServices') || '[]')
      setServicesData(
        local.filter(s => (s.status || '').toLowerCase() === 'approved').map(s => ({
          id:           s._id || s.id,
          img:          s.image || 'https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80',
          icon:         getIcon(s.category),
          title:        s.serviceName || s.name,
          providerName: s.providerName || '',
          baseFee:      s.baseFee      || 0,
          duration:     s.duration     || 'N/A',
          description:  s.description  || '',
          category:     s.category     || 'General',
        }))
      )
    }
  }

  return (
    <section className="services_section" id="services">
      <div className="services_header">
        <h2>Our Services</h2>
        <p>We provide intelligent health support through technology and professional medical care.</p>
      </div>

      {servicesData.length === 0 ? (
        <div className="services_empty">
          <Empty description="No services available yet. Check back soon!" imageStyle={{ height: 80 }} />
        </div>
      ) : (
        <div className="services_container">
          {servicesData.map(item => (
            <div key={item.id} className="service_card">
              <div className="card_img_container">
                <img
                  src={item.img}
                  alt={item.title}
                  className="card_image"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80' }}
                />
                <div className="card_category_badge">{item.category}</div>
                <div className="card_icon_badge">{item.icon}</div>
              </div>
              <div className="card_content">
                <h3 className="card_title">{item.title}</h3>
                {item.providerName && <p className="card_provider">By Dr. {item.providerName}</p>}
                <p className="card_description">{item.description}</p>
                <div className="card_meta">
                  <div className="meta_item"><FaClock className="meta_icon" /><span>Response: {item.duration} hrs</span></div>
                  <div className="meta_item meta_fee"><FaRupeeSign className="meta_icon" /><span>Rs. {item.baseFee}</span></div>
                </div>
                <Button type="primary" className="book_service_btn" onClick={() => { setSelectedService(item); setBookingOpen(true) }} block>
                  Book Consultation
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} preSelectedService={selectedService?.title} />
    </section>
  )
}