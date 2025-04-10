type Props = {
  onClick?: Function;
  label: string;
  loading: boolean;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
};

export default function SubmitButton({
  onClick,
  label,
  loading,
  className,
  type,
}: Props) {
  return (
    <button
      type={type ? type : undefined}
      className={`btn btn-accent dark:border-violet-400 text-white tracking-wider w-fit flex items-center gap-2 ${
        className || ""
      }`}
      onClick={() => {
        if (!loading && onClick) onClick();
      }}
    >
      <p>{label}</p>
    </button>
  );
}
