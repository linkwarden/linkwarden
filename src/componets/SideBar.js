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

const SideBar = ({ tags, handleToggleSidebar, toggle }) => {
  const sortedTags = tags.sort((a, b) => {
    const A = a.toLowerCase(),
      B = b.toLowerCase();
    if (A < B) return -1;
    if (A > B) return 1;
    return 0;
  });
  return (
    <ProSidebar
      toggled={toggle}
      breakPoint="lg"
      onToggle={handleToggleSidebar}
      className="sidebar"
    >
      <SidebarHeader>
        <h1>LinkWarden</h1>
      </SidebarHeader>
      <SidebarContent className="sidebar-content">
        <Menu iconShape="circle">
          <MenuItem>
            <Link to="/">
              <h3>Show Everything</h3>
            </Link>
          </MenuItem>

          <SubMenu
            icon={<h2>#</h2>}
            suffix={<span className="badge">{sortedTags.length}</span>}
            defaultOpen={true}
            title="Tags"
          >
            {sortedTags.map((e, i) => {
              const path = `/tags/${e}`;
              return (
                <MenuItem prefix={"#"} key={i}>
                  <Link to={path}>{e}</Link>
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
