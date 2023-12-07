import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
  onClick?: Function;
  icon?: IconProp;
  label: string;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
};

export default function AccentSubmitButton({
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
      className={`border primary-btn-gradient select-none duration-200 bg-black border-[oklch(var(--p))] hover:border-[#0070b5] rounded-lg text-center px-4 py-2 text-white active:scale-95 tracking-wider w-fit flex justify-center items-center gap-2 ${
        className || ""
      }`}
      onClick={() => {
        if (loading !== undefined && !loading && onClick) onClick();
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="h-5" />}
      <p className="font-bold">{label}</p>
    </button>
  );
}
