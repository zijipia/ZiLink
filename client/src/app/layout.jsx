import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

/** @type {import('next').Metadata} */
export const metadata = {
	title: "ZiLink IoT Platform",
	description: "Comprehensive IoT device management platform",
};

/**
 * Root layout component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function RootLayout({ children }) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
				<AuthProvider>
					<ThemeToggle />
					{children}
					<Toaster
						position='top-right'
						toastOptions={{
							duration: 4000,
							style: {
								background: "#363636",
								color: "#fff",
							},
						}}
					/>
				</AuthProvider>
			</body>
		</html>
	);
}
