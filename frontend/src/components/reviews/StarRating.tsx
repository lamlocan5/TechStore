"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface StarRatingProps {
    value: number;  // 0-5
    onChange?: (rating: number) => void;
    size?: "sm" | "md" | "lg";
    interactive?: boolean;
    showValue?: boolean;
}

export function StarRating({
    value,
    onChange,
    size = "md",
    interactive = false,
    showValue = false
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    const displayRating = interactive && hoverRating > 0 ? hoverRating : value;

    const handleClick = (rating: number) => {
        if (interactive && onChange) {
            onChange(rating);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        whileHover={interactive ? { scale: 1.1 } : {}}
                        whileTap={interactive ? { scale: 0.95 } : {}}
                        className={`
              ${interactive ? "cursor-pointer" : "cursor-default"}
              transition-colors
              ${!interactive && "pointer-events-none"}
            `}
                    >
                        <Star
                            className={`
                ${sizeClasses[size]}
                transition-all duration-200
                ${star <= displayRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-gray-300"
                                }
                ${interactive && star <= hoverRating && "drop-shadow-md"}
              `}
                        />
                    </motion.button>
                ))}
            </div>

            {showValue && (
                <span className="text-sm font-medium text-gray-700 ml-1">
                    {value.toFixed(1)}
                </span>
            )}
        </div>
    );
}
