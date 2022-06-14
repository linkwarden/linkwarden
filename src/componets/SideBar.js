import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import '../styles/SideBar.css';
import { useState } from 'react';

const SideBar = ({ handleToggleSidebar, toggle }) => {
  return (
    <ProSidebar 
        toggled={toggle}
        breakPoint="lg"
        onToggle={handleToggleSidebar}
        className='sidebar'>
    <SidebarHeader>
        LOGO
    </SidebarHeader>
    <SidebarContent>
        CONTENT
    </SidebarContent>
    <SidebarFooter>
        FOOTER
    </SidebarFooter>
    </ProSidebar>
  )
}

export default SideBar