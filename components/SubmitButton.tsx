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
      className={`text-white flex items-center gap-2 py-2 px-5 rounded-md text-lg tracking-wide select-none font-semibold duration-100 w-fit ${
        loading
          ? "bg-sky-600 cursor-auto"
          : "bg-sky-700 hover:bg-sky-600 cursor-pointer"
      } ${className || ""}`}
      onClick={() => {
        if (!loading && onClick) onClick();
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="h-5" />}
      <p className="text-center w-full">{label}</p>
    </button>
  );
}
