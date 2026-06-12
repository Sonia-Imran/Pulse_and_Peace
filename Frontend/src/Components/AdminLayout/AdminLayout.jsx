import React, { useState } from 'react'
import SideBar from './SideBar/sideBar'
import TopBar from './TopBar/topBar'
import './AdminLayout.css'

function AdminLayout({ children }) {
  const [tabName, setTabName] = useState('Dashboard')

  return (
    <div className="admin-layout">
      <div className="admin-sidebar-panel">
        <SideBar setTabName={setTabName} />
      </div>
      <div className="admin-main-workspace">
        <div className="admin-topbar-panel">
          <TopBar tabName={tabName} />
        </div>
        <div className="admin-content-area">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout