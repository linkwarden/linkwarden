import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
  onClick?: Function;
  icon?: IconProp;
  label: string;
  loading: boolean;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
};

export default function SubmitButton({
  onClick,
  icon,
  label,
  loading,
  className,
  type,
}: Props) {
  return (
    <button
      type={type ? type : undefined}
      className={`btn btn-accent text-white tracking-wider w-fit flex items-center gap-2 ${
        className || ""
      }`}
      onClick={() => {
        if (!loading && onClick) onClick();
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="h-5" />}
      <p>{label}</p>
    </button>
  );
}
