import React from "react";
import { useTranslation } from "next-i18next";
import clsx from "clsx";

type Props = {
  onClick: Function;
  className?: string;
};

function EditButton({ onClick, className }: Props) {
  const { t } = useTranslation();

  return (
    <span
      onClick={() => onClick()}
      className={clsx(
        "group-hover:opacity-100 opacity-0 duration-100 btn-square btn-xs btn btn-ghost absolute bi-pencil-fill text-neutral cursor-pointer -right-7 text-xs",
        className
      )}
      title={t("edit")}
    ></span>
  );
}

export default EditButton;
