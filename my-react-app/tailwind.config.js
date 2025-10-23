// tailwind.config.js
module.exports = {
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
        colors: {
            neutral: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
            },
            blue: {
            50: "#eff6ff",
            100: "#dbeafe",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            },
            orange: {
            500: "#f97316",
            600: "#ea580c",
            },
            purple: {
            500: "#a855f7",
            600: "#9333ea",
            },
            emerald: {
            500: "#10b981",
            600: "#059669",
            },
        },
        borderRadius: {
            lg: "0.75rem",
            xl: "1rem",
        },
        fontSize: {
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem",
        },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}// tailwind.config.js
module.exports = {
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
        colors: {
            neutral: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
            },
            blue: {
            50: "#eff6ff",
            100: "#dbeafe",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            },
            orange: {
            500: "#f97316",
            600: "#ea580c",
            },
            purple: {
            500: "#a855f7",
            600: "#9333ea",
            },
            emerald: {
            500: "#10b981",
            600: "#059669",
            },
        },
        borderRadius: {
            lg: "0.75rem",
            xl: "1rem",
        },
        fontSize: {
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem",
        },
        },
    },
    plugins: [],
}