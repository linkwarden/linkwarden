import clsx from "clsx";
import React from "react";

export default function PageHeader({
  title,
  description,
  icon,
  className,
  titleTag = "h2",
}: {
  title: string;
  description?: string;
  icon: string;
  className?: string;
  /**
   * The heading level element for the page title
   * */
  titleTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  const HeadingComponent = titleTag;
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <i
        className={`${icon} text-primary text-2xl drop-shadow`}
        aria-hidden="true"
      ></i>
      <div>
        <HeadingComponent className="text-2xl capitalize font-thin">
          {title}
        </HeadingComponent>
        {description && <p className="text-xs sm:text-sm">{description}</p>}
      </div>
    </div>
  );
}
