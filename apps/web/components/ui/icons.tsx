import clsx from "clsx";

type Props = {
  className?: string;
};

export const FormatSize = ({ className }: Props) => (
  <svg
    className={clsx("text-neutral", className)}
    fill="currentColor"
    width="1em"
    height="1em"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
  >
    <path d="M560-160v-520H360v-120h520v120H680v520H560Zm-360 0v-320H80v-120h360v120H320v320H200Z" />
  </svg>
);

export const FormatLineSpacing = ({ className }: Props) => (
  <svg
    className={clsx("text-neutral", className)}
    fill="currentColor"
    width="1em"
    height="1em"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
  >
    <path d="M240-160 80-320l56-56 64 62v-332l-64 62-56-56 160-160 160 160-56 56-64-62v332l64-62 56 56-160 160Zm240-40v-80h400v80H480Zm0-240v-80h400v80H480Zm0-240v-80h400v80H480Z" />
  </svg>
);

export const FitWidth = ({ className }: Props) => (
  <svg
    className={clsx("text-neutral", className)}
    fill="currentColor"
    width="1em"
    height="1em"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
  >
    <path d="M120-120v-720h80v720h-80Zm640 0v-720h80v720h-80ZM280-440v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Z" />
  </svg>
);
