import clsx from "clsx";
import React from "react";

export default function PageHeader({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <i
        className={`${icon} text-primary sm:text-3xl text-2xl drop-shadow`}
      ></i>
      <div>
        <p className="text-3xl capitalize font-thin">{title}</p>
        <p className="text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
}
