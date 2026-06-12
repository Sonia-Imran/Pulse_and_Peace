import React, { useState, useEffect } from "react";
import "./Footer.css";
import { FaFacebook, FaInstagramSquare } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoWhatsapp } from "react-icons/io";
import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail } from "react-icons/hi";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [approvedServices, setApprovedServices] = useState([]);

  useEffect(() => {
    const localServices = JSON.parse(localStorage.getItem("localServices") || "[]");
    const approved = localServices.filter(s => s.status === "Approved");
    setApprovedServices(approved.slice(0, 6));
  }, []);

  return (
    <footer className="footer" id="contact">
      <div className="footer_container">
        
        <div className="footer_column">
          <h2 className="footer_text">Pulse & Peace</h2>
          <p className="footer_desc">
            Your trusted partner in mental health and wellness. 
            Professional support when you need it most.
          </p>
          <div className="social_icons">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaXTwitter /></a>
            <a href="#"><FaInstagramSquare /></a>
            <a href="#"><IoLogoWhatsapp /></a>
          </div>
        </div>
        
        <div className="footer_column">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#doctors">Our Doctors</a></li>
          </ul>
        </div>

        <div className="footer_column">
          <h3>Our Services</h3>
          <ul>
            {approvedServices.length === 0 ? (
              <>
                <li className="bm-no-services">No approved services available.</li>
                
              </>
            ) : (
              approvedServices.map((service, index) => (
                <li key={service._id || index}>
                  {service.serviceName}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="footer_column contact_col">
          <h3>Contact Us</h3>
          <div className="contact_item">
            <HiOutlineLocationMarker className="icons" />
            <span>123 Wellness Street, Health City, HC 12345</span>
          </div>
          <div className="contact_item">
            <HiOutlinePhone className="icons" />
            <span>+92 324 4015832</span>
          </div>
          <div className="contact_item">
            <HiOutlineMail className="icons" />
            <span>support@Pulse&Peace.com</span>
          </div>
        </div>

      </div>
      
      <div className="footer_bottom">
        <p>&copy; {currentYear} Pulse & Peace. All rights reserved.</p>
        <div className="footer_legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}