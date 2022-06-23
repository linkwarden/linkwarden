import {
  ProSidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  Menu,
  MenuItem,
  SubMenu,
} from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import "../styles/SideBar.css";
import { Link } from "react-router-dom";

const SideBar = ({ tags, collections, handleToggleSidebar, toggle }) => {
  const sortedTags = tags.sort((a, b) => {
    const A = a.toLowerCase(),
      B = b.toLowerCase();
    if (A < B) return -1;
    if (A > B) return 1;
    return 0;
  });

  const sortedCollections = collections
    .sort((a, b) => {
      const A = a.toLowerCase(),
        B = b.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    })
    .filter((e) => {
      return e != "Unsorted";
    });

  return (
    <ProSidebar
      toggled={toggle}
      breakPoint="lg"
      onToggle={handleToggleSidebar}
      className="sidebar"
    >
      <SidebarHeader>
        <h3>LinkWarden</h3>
      </SidebarHeader>
      <SidebarContent className="sidebar-content">
        <Menu iconShape="circle">
          <MenuItem icon={<h2 className="sidebar-icon">&#xf015;</h2>}>
            <Link to="/">
              <div className="menu-item">All</div>
            </Link>
          </MenuItem>

          <SubMenu
            icon={<h2 className="sidebar-icon">&#xf5fd;</h2>}
            suffix={<span className="badge">{sortedCollections.length}</span>}
            title={<div className="menu-item">Collections</div>}
          >
            <MenuItem prefix={<div className="sidebar-item-prefix">&#xf07b;</div>}>
              <Link className="sidebar-entity" to="/collections/Unsorted">Unsorted</Link>
            </MenuItem>
            {sortedCollections.map((e, i) => {
              const path = `/collections/${e}`;
              return (
                <MenuItem prefix={<div className="sidebar-item-prefix">&#xf07b;</div>} key={i}>
                  <Link className="sidebar-entity" to={path}>{e}</Link>
                </MenuItem>
              );
            })}
          </SubMenu>

          <SubMenu
            icon={<h2 className="sidebar-icon">&#xf02c;</h2>}
            suffix={<span className="badge">{sortedTags.length}</span>}
            title={<div className="menu-item">Tags</div>}
          >
            {sortedTags.map((e, i) => {
              const path = `/tags/${e}`;
              return (
                <MenuItem prefix={<div className="sidebar-item-prefix">&#x23;</div>} key={i}>
                  <Link className="sidebar-entity" to={path}>{e}</Link>
                </MenuItem>
              );
            })}
          </SubMenu>
        </Menu>
      </SidebarContent>
      <SidebarFooter>
        <p className="credits">
          ©{new Date().getFullYear()} Made with 💙 by{" "}
          <a href="https://github.com/Daniel31x13">Daniel 31X13</a>
        </p>
      </SidebarFooter>
    </ProSidebar>
  );
};

export default SideBar;
