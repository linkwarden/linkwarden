import clsx from "clsx";

type MenuIconButtonProps = {
  onClick: () => void;
  isActive: boolean;
  icon: string;
  title?: string;
};

const MenuIconButton: React.FC<MenuIconButtonProps> = ({
  onClick,
  isActive,
  icon,
  title,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        isActive ? "is-active btn-primary" : "btn-ghost",
        "btn btn-square btn-sm duration-100"
      )}
      title={title}
      type="button"
    >
      <i className={icon} />
    </button>
  );
};

export default MenuIconButton;
