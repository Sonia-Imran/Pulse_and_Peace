import React from 'react'
import './HowItWorks.css'
export default function HowItWorks() {
    const HowItWorkData = [
        {
          id:1,
          StepNo:"Step 1",
          title: "Create an Account",
          description:"Join the Pulse & Peace community by creating a secure and private profile. It only takes a minute to start your journey toward better mental health and emotional well-being.",
          img: "./Images/img1.jpg",  
        },
        {
          id:2,
          StepNo:"Step 2",
          title: "Chat With AI",
          description:"Get instant, 24/7 support from our intelligent AI assistant. Share your thoughts, track your moods, and receive immediate coping strategies in a judgment-free space. Our AI assistant helps match you with the perfect therapist based on your preferences and needs.",
          img: "./Images/img2.png",  
        },
        {
          id:3,
          StepNo:"Step 3",
          title: "Consult With Doctor",
          description:"Schedule a one-on-one chat session with certified therapists or doctors. Receive professional guidance, clinical diagnosis, and a personalized treatment plan tailored to your specific needs.",
          img: "./Images/img3.webp",  
        },
    ]
  return (
      <section className="how_section">
        <div className="how_header">
            <h2 className="how_title">
                How It <span className="highlight">
                    Works
                </span>
            </h2>
        </div>
        <div className="how_container">
           { HowItWorkData.map((item, index) =>(
              <div key= {item.id} className="how_card">
                 <div className="how_image_wrapper">
                    <img src= {item?.img} alt="" className="how_img" />
                 </div>
                 <div className="how_content">
                    <span className="step_no">{item.StepNo}</span>
                    <h3 className="step_title">{item.title} </h3>
                    <p className="step_description"> {item.description} </p>
                 </div>
              </div>
           )
        )}
        </div>
      </section>
  )
}


