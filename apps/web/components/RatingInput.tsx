import React from "react";
import { Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  editable: boolean;
  onChange?: (value: number) => void;
  value?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function RatingInput({
  editable,
  onChange,
  value = 0,
  maxRating = 5,
  size = "md",
  className,
}: RatingInputProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleStarClick = (starValue: number) => {
    if (editable && onChange) {
      onChange(starValue);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, starValue: number) => {
    if (editable && onChange) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onChange(starValue);
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "transition-colors duration-150  rounded-sm",
              editable && "cursor-pointer hover:scale-110",
              !editable && "cursor-default"
            )}
            onClick={() => handleStarClick(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            disabled={!editable}
            tabIndex={editable ? 0 : -1}
            aria-label={`Rate ${starValue} out of ${maxRating}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 hover:text-yellow-300",
                "transition-colors duration-150"
              )}
              weight={isFilled ? "fill" : "regular"}
            />
          </button>
        );
      })}
    </div>
  );
}

export default RatingInput;
