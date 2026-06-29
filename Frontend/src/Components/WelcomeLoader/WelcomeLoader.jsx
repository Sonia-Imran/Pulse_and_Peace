import { useEffect, useState } from "react"
import "./WelcomeLoader.css"

/**
 * Full-screen white welcome/loading screen shown right after a successful
 * login (patient / doctor / admin) before redirecting to the respective
 * dashboard. A colorful little bird loops around the whole screen dropping
 * tiny hearts as it flies, then comes in to land gently on a beating
 * teal-green heart (peace + care theme).
 *
 * Usage:
 *   <WelcomeLoader name="Dr. Ahmed" role="doctor" onFinish={() => navigate('/doctor/dashboard')} />
 */
const ROLE_TEXT = {
  patient: "Welcome back",
  doctor:  "Welcome back, Doctor",
  admin:   "Welcome back, ",
}

const WelcomeLoader = ({ name = "", role = "patient", duration = 3400, onFinish }) => {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 450)
    const finishTimer = setTimeout(() => onFinish && onFinish(), duration)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(finishTimer)
    }
  }, [duration, onFinish])

  return (
    <div className={`wl-screen ${leaving ? "wl-screen--leaving" : ""}`}>
      <div className="wl-stage">
        <svg className="wl-ecg" viewBox="0 0 600 80" preserveAspectRatio="none">
          <polyline
            className="wl-ecg-line"
            points="0,40 60,40 80,40 95,10 110,70 125,40 160,40 200,40 220,40 235,15 250,65 265,40 300,40 340,40 360,40 375,10 390,70 405,40 440,40 480,40 500,40 515,15 530,65 545,40 600,40"
            fill="none"
          />
        </svg>

        <div className="wl-heart-wrap">
          <svg className="wl-heart" viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
            <path
              className="wl-heart-path"
              d="M100,170
                 C100,170 10,110 10,55
                 C10,20 35,2 62,2
                 C82,2 96,14 100,28
                 C104,14 118,2 138,2
                 C165,2 190,20 190,55
                 C190,110 100,170 100,170 Z"
            />
          </svg>
        </div>

        <div className="wl-ripple wl-ripple--one" />
        <div className="wl-ripple wl-ripple--two" />
      </div>

      {/* Bird loops around the whole screen, then lands on the heart */}
      <svg className="wl-bird" viewBox="0 0 100 64">
        {/* tail feathers */}
        <path className="wl-bird-tail" d="M14,34 L0,24 L6,36 L0,48 L16,40 Z" />

        {/* body */}
        <ellipse className="wl-bird-body-shape" cx="48" cy="36" rx="26" ry="15" />

        {/* belly patch */}
        <ellipse className="wl-bird-belly" cx="52" cy="42" rx="14" ry="8" />

        {/* head */}
        <circle className="wl-bird-head" cx="76" cy="24" r="10" />

        {/* beak */}
        <path className="wl-bird-beak" d="M85,22 L96,25 L85,29 Z" />

        {/* eye */}
        <circle className="wl-bird-eye" cx="79" cy="21" r="1.6" />

        {/* back wing (flaps slower, peeking out) */}
        <path
          className="wl-bird-wing wl-bird-wing--back"
          d="M40,30 C34,12 18,6 6,10 C18,10 30,18 36,32 Z"
        />

        {/* front wing (main flap) */}
        <path
          className="wl-bird-wing wl-bird-wing--front"
          d="M44,30 C40,10 24,2 10,6 C24,8 36,18 40,34 Z"
        />

        {/* small feet, for the landed moment */}
        <path className="wl-bird-feet" d="M40,50 L36,56 M52,50 L56,56" />
      </svg>

      {/* Tiny hearts scattered across the whole screen, dropped along the bird's flight path */}
      <div className="wl-falling-hearts">
        {Array.from({ length: 12 }).map((_, i) => (
          <svg key={i} className={`wl-mini-heart wl-mini-heart--${i + 1}`} viewBox="0 0 32 28">
            <path d="M16,27 C16,27 1,17 1,8.5 C1,3 5.5,0 10,0 C13,0 15.5,2 16,4.5 C16.5,2 19,0 22,0 C26.5,0 31,3 31,8.5 C31,17 16,27 16,27 Z" />
          </svg>
        ))}
      </div>

      <div className="wl-text">
        <h2 className="wl-greeting">
          {ROLE_TEXT[role] || ROLE_TEXT.patient}{name ? `, ${name}` : ""}
        </h2>
        <p className="wl-sub">Getting your space ready, with a little peace of mind...</p>
      </div>

      <div className="wl-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

export default WelcomeLoader