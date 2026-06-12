import "./AboutSection.css";
import { FaHandHoldingHeart } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { RiGraduationCapFill } from "react-icons/ri";

export default function AboutSection() {
  return (
    <section className="about_container" id="about">
      <div className="about_content">
        <div className="about_image-wrapper">
          <img src="./Images/aboutimg.png" className="about_image"/>
        </div>
        <div className="about_text-wrapper">
          <h2 className="about_title">About Us</h2>
          <p className="about_description">
            At Pulse & Peace, we believe everyone deserves access to quality mental
            health support. Our platform connects you with licensed therapists,
            counselors, and psychiatrists who are dedicated to helping you
            achieve mental wellness.
          </p>
          <p className="about_description">
            With over 10 years of experience and thousands of successful
            consultations, we're committed to providing compassionate,
            professional care that fits your schedule and lifestyle.
          </p>
          <div className="features_list">
            <div className="feature_item">
              <div className="feature_icon">
                <FaHandHoldingHeart />
              </div>
              <div>
                <h4 className="feature_name">Compassionate Care</h4>
                <p className="feature_detail">
                  Empathetic professionals who truly care about your wellbeing
                </p>
              </div>
            </div>
            <div className="feature_item">
              <div className="feature_icon">
                <MdPrivacyTip />
              </div>
              <div>
                <h4 className="feature_name">100% Confidential</h4>
                <p className="feature_detail">
                  Your privacy and security are our top priorities
                </p>
              </div>
            </div>
            <div className="feature_item">
              <div className="feature_icon">
                <RiGraduationCapFill />
              </div>
              <div>
                <h4 className="feature_name">Licensed Professionals</h4>
                <p className="feature_detail">
                  All our therapists are certified and experienced
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

