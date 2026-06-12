import React from 'react';
import './WhyChooseUs.css';

export default function WhyChooseUs() {
   const reasons = [
    {
        id: 1,
        img: "./Images/avalibility.jpg",
        name: "24/7 Availability", 
    },
    {
        id: 2,
        img: "./Images/privacy.png", 
        name: "Complete Privacy", 
    },
    {
        id: 3,
        img: "./Images/team.jpg",
        name: "Expert Therapists", 
    },
    {
        id: 4,
        img: "./Images/care.jpg",
        name: "Personalized Care",
    },
    {
        id: 5,
        img: "./Images/instant.png",
        name: "Instant Support", 
    },
    {
        id: 6,
        img: "./Images/inner.jpg", 
        name: "Inner Peace", 
    },
    {
        id: 7,
        img: "./Images/rapid.png", 
        name: "Rapid Assistance", 
    },
    {
        id: 8,
        img: "./Images/effective.png", 
        name: "Effective Recovery", 
    },
]

    return (
        <section className="why_section">
            <div className="why_header">
                <h2 className="why_title">Why Choose <span className="brand_name">Pulse & Peace</span>?</h2>
                <p className="why_subtitle">
                    We're committed to providing the highest quality mental health care with a focus on your comfort and wellbeing.
                </p>
            </div>

            <div className="why_container">
                {reasons.map((item) => (
                    <div key={item.id} className="why_card">
                        <div className="why_image_box">
                            <img src={item.img} alt={item.name} className="reason_image" />
                        </div>
                        <div className="why_card_footer">
                            <p className="why_card_title">{item.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}