import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SideBard from './SidebarDoctor/DoctorSideBar'
import TopBarDoctor from './TopBarDoctor/TopBarDoctor'
import './DoctorLayout.css'

const DoctorLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [profileModal, setProfileModal] = useState(false)

  return (
    <div className="doctor-layout">
      <SideBard
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        profileModal={profileModal}
        setProfileModal={setProfileModal}
      />
      <div className={`doctor-main ${collapsed ? 'collapsed' : ''}`}>
        <TopBarDoctor
          collapsed={collapsed}
          onEditProfile={() => setProfileModal(true)}
        />
        <div className="doctor-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DoctorLayout