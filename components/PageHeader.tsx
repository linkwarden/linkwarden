import React from "react";

export default function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <i
        className={`${icon} text-primary text-3xl sm:text-4xl drop-shadow`}
      ></i>
      <div>
        <p className="text-3xl capitalize font-thin">{title}</p>
        <p className="text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
}
