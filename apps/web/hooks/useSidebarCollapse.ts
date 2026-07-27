import { useEffect, useState } from "react";

export default function useSidebarCollapse() {
  const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState<boolean>(
    () => localStorage.getItem("sidebarIsCollapsed") === "true"
  );

  useEffect(() => {
    localStorage.setItem(
      "sidebarIsCollapsed",
      sidebarIsCollapsed ? "true" : "false"
    );
  }, [sidebarIsCollapsed]);

  const toggleSidebar = () => setSidebarIsCollapsed(!sidebarIsCollapsed);

  return { sidebarIsCollapsed, toggleSidebar };
}
