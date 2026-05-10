"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
    return (
        <HotToaster
            position="top-right"
            toastOptions={{
                duration: 5000,
                style: {
                    background: "transparent",
                    boxShadow: "none",
                    padding: 0,
                },
            }}
        />
    );
}
