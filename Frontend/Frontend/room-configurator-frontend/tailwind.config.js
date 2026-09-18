import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
		"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				"context-menu": {
					"0%": { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
					"100%": { opacity: "1", transform: "scale(1) translateY(0)" },
				},
				"loader-spin": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" },
				},
				"loader-pulse": {
					"0%, 100%": { opacity: "0.4" },
					"50%": { opacity: "1" },
				},
				"loader-fade-out": {
					"0%": { opacity: "1" },
					"100%": { opacity: "0" },
				},
			},
			animation: {
				"fade-in": "fade-in 0.2s ease-out",
				"context-menu": "context-menu 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
				"loader-spin": "loader-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
				"loader-pulse": "loader-pulse 2s ease-in-out infinite",
				"loader-fade-out": "loader-fade-out 0.4s ease-out forwards",
			},
		},
	},
	darkMode: "class",
	plugins: [heroui()],
};
