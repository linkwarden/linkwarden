import { cn } from "@/lib/utils";
import React from "react";

export default function PageHeader({
  title,
  description,
  icon,
  className,
  sm,
}: {
  title: string;
  description?: string;
  icon: string;
  className?: string;
  sm?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center", className, !sm ? "gap-3" : "gap-2")}
    >
      <i
        className={cn("text-primary drop-shadow", icon, !sm && "text-2xl")}
      ></i>
      <div>
        <p className={cn("capitalize font-thin", !sm && "text-2xl")}>{title}</p>
        <p className="text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
}
