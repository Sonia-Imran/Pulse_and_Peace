import { useState, useEffect } from "react";
import "./Doctors.css";
import { FaMedal } from "react-icons/fa";
import { IoMdStar } from "react-icons/io";
import { Carousel, message, Rate, List, Avatar, Modal, Space } from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import BookingModal from "../../../../Components/BookingModal/BookingModal";
import API from "../../../../api";

const { Text } = Typography;

export default function Doctors() {
  const [allDoctors, setAllDoctors] = useState([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewDoctor, setReviewDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/doctor/all");
      const doctors = await Promise.all(
        data.data.map(async (d) => {
          let reviewCount = 0;
          let avgRating = d.rating || 0;
          try {
            const { data: rData } = await API.get(`/reviews/doctor/${d._id}`);
            const reviewList = rData.data || [];
            reviewCount = reviewList.length;
            avgRating = reviewCount
              ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewCount
              : 0;
          } catch {
            reviewCount = 0;
          }
          return {
            id:          d._id,
            fullName:    d.fullName,
            specialty:   d.specialty   || "General Physician",
            experience:  d.experience  || "N/A",
            img:         d.avatarUrl   || d.avatar || null,
            rating:      avgRating,
            reviewCount,
            education:   d.education   || "Medical Degree",
            description: d.description || "Experienced medical professional dedicated to patient care.",
            phone:       d.phone       || "",
          };
        })
      );
      setAllDoctors(doctors);
    } catch {
      message.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingOpen(true);
  };

  const openReviews = async (doctor) => {
    setReviewDoctor(doctor);
    setReviewModal(true);
    setReviewsLoading(true);
    try {
      const { data } = await API.get(`/reviews/doctor/${doctor.id}`);
      setReviews(data.data || []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
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
          <div className="doctor_empty_icon">⏳</div>
          <p className="doctor_empty_text">Loading doctors...</p>
        </div>
      </section>
    );
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
    );
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
                    <span><IoMdStar /> {item.rating > 0 ? Number(item.rating).toFixed(1) : "No ratings"}</span>
                  </div>

                  <div className="doctor_rating_row">
                    <Rate disabled allowHalf value={item.rating} style={{ fontSize: 14 }} />
                    <button
                      className="doctor_review_btn"
                      onClick={() => openReviews(item)}
                    >
                      <MessageOutlined style={{ marginRight: 4 }} />
                      {item.reviewCount > 0
                        ? `${item.reviewCount} Review${item.reviewCount > 1 ? "s" : ""}`
                        : "No Reviews"}
                    </button>
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

      <Modal
        title={`Reviews — Dr. ${reviewDoctor?.fullName || ""}`}
        open={reviewModal}
        onCancel={() => { setReviewModal(false); setReviews([]); }}
        footer={null}
        width={560}
      >
        {reviews.length === 0 && !reviewsLoading ? (
          <Text type="secondary">No reviews yet for this doctor.</Text>
        ) : (
          <List
            loading={reviewsLoading}
            dataSource={reviews}
            renderItem={r => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Text strong>{r.patient?.fullName || "Patient"}</Text>
                      <Rate disabled value={r.rating} style={{ fontSize: 12 }} />
                    </Space>
                  }
                  description={r.comment || "No comment"}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(r.createdAt).toLocaleDateString("en-PK")}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </section>
  );
}