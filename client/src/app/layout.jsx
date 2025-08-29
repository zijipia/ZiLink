import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ToastProvider from "@/components/ui/toaster";

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
		<html
			lang='en'
			className='h-full'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased h-full min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors`}>
				<AuthProvider>
					<ThemeToggle />
					{children}
					<ToastProvider />
				</AuthProvider>
			</body>
		</html>
	);
}
