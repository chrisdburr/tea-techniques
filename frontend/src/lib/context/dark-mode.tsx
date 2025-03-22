"use client";

import React, {
	createContext,
	useState,
	useContext,
	useEffect,
	ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";

type DarkModeContextType = {
	isDarkMode: boolean;
	toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeContextType>({
	isDarkMode: false,
	toggleDarkMode: () => {},
});

export const DarkModeProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Check for saved preference or system preference on initial load
	useEffect(() => {
		const savedMode = localStorage.getItem("darkMode");
		const prefersDarkMode = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;

		if (savedMode !== null) {
			setIsDarkMode(savedMode === "true");
		} else {
			setIsDarkMode(prefersDarkMode);
		}
	}, []);

	// Apply dark mode class to document
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("darkMode", "true");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("darkMode", "false");
		}
	}, [isDarkMode]);

	const toggleDarkMode = () => {
		setIsDarkMode(!isDarkMode);
	};

	return (
		<DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
			{children}
		</DarkModeContext.Provider>
	);
};

// Custom hook for easy dark mode access
export const useDarkMode = () => useContext(DarkModeContext);

// Dark Mode Toggle Component
export const DarkModeToggle: React.FC = () => {
	const { isDarkMode, toggleDarkMode } = useDarkMode();

	return (
		<button
			onClick={toggleDarkMode}
			className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
			aria-label={
				isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
			}
		>
			{isDarkMode ? (
				<Sun className="h-5 w-5 text-white" />
			) : (
				<Moon className="h-5 w-5 text-gray-800" />
			)}
		</button>
	);
};
