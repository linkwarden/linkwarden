import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import '../styles/SideBar.css';

const SideBar = ({ tags, handleToggleSidebar, toggle }) => {
  return (
    <ProSidebar 
        toggled={toggle}
        breakPoint="lg"
        onToggle={handleToggleSidebar}
        className='sidebar'>
    <SidebarHeader>
        <h1>LinkWarden</h1>
    </SidebarHeader>
    <SidebarContent className='sidebar-content'>

        <h3>Tags:</h3>
        {tags.map((e) => {
            return <p>{e}</p>
        })}
    </SidebarContent>
    <SidebarFooter>
        <p className='credits'>©{new Date().getFullYear()} Made with 💙 by <a href='https://github.com/Daniel31x13'>Daniel 31X13</a></p>
    </SidebarFooter>
    </ProSidebar>
  )
}

export default SideBar