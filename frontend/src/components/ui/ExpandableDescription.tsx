"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandableDescriptionProps {
    content: string;
    maxLength?: number;
}

export function ExpandableDescription({ content, maxLength = 2000 }: ExpandableDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if content needs truncation
    const needsTruncation = content.length > maxLength;
    const displayContent = needsTruncation && !isExpanded
        ? content.substring(0, maxLength) + "..."
        : content;

    if (!needsTruncation) {
        return (
            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={isExpanded ? "expanded" : "collapsed"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: displayContent }}
                />
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
            >
                <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="gap-2"
                >
                    {isExpanded ? (
                        <>
                            Thu gọn
                            <ChevronUp className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Xem thêm nội dung
                            <ChevronDown className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </motion.div>
        </div>
    );
}
