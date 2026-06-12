import React from 'react'
import Banner from '../Home/Banner/Banner'
import About from '../Home/About/About'
import Services from '../Home/Services/Services'
import HowItWorks from '../Home/HowItWorks/HowItWorks'
import Doctors from '../Home/Doctors/Doctors'
import WhyChooseUs from '../Home/WhyChooseUs/WhyChooseUs'
import Header from '../../../Components/Header/Header'
import Footer from '../../../Components/Footer/Footer'

function Home() {
  const serviceslist = JSON.parse(localStorage.getItem('services'))

  return (
    <div>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <section id="home">
          <Banner />
        </section>
        <section id="about">
          <About />
        </section>
        <section id="services">
          <Services data={serviceslist} />
        </section>
        <section id="howitworks">
          <HowItWorks />
        </section>
        <section id="whychooseus">
          <WhyChooseUs />
        </section>
        <section id="doctors">
          <Doctors />
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default Home