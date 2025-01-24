import ReactDOM from "react-dom";

function PortalWrapper({
  children,
  usePortal,
}: {
  children: React.ReactNode;
  usePortal: boolean;
}) {
  if (!usePortal) {
    return <>{children}</>;
  }

  return ReactDOM.createPortal(children, document.body);
}

export default PortalWrapper;
