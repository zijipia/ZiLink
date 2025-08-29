import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/Header";
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
			className='h-full'
			suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased h-full min-h-screen text-gray-900 dark:text-gray-100 transition-colors`}>
				<AuthProvider>
					<ThemeProvider
						attribute='class'
						defaultTheme='system'
						enableSystem
						disableTransitionOnChange>
						<Header />
						{children}
						<ToastProvider />
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
