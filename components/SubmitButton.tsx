import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-regular-svg-icons";

type Props = {
  onClick: Function;
  icon?: IconDefinition;
  label: string;
  loading: boolean;
  className?: string;
};

export default function SubmitButton({
  onClick,
  icon,
  label,
  loading,
  className,
}: Props) {
  return (
    <div
      className={`text-white flex items-center gap-2 py-2 px-5 rounded-md text-lg tracking-wide select-none font-semibold duration-100 w-fit ${
        loading
          ? "bg-sky-400 cursor-auto"
          : "bg-sky-500 hover:bg-sky-400 cursor-pointer"
      } ${className}`}
      onClick={() => {
        if (!loading) onClick();
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="h-5" />}
      <p className="text-center w-full">{label}</p>
    </div>
  );
}
