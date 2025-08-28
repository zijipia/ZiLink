"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import apiService from "@/lib/api";

/**
 * Login page component
 * @returns {React.JSX.Element}
 */
const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login, isLoading: authLoading, isAuthenticated } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!authLoading && isAuthenticated) {
			router.replace("/dashboard");
		}
	}, [authLoading, isAuthenticated, router]);
	/**
	 * Handle email login form submission
	 * @param {React.FormEvent} e
	 */
	const handleEmailLogin = async (e) => {
		e.preventDefault();

		if (!email || !password) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			setIsLoading(true);
			await login(email, password);
			router.replace("/dashboard");
		} catch (error) {
			const errorMessage = error?.response?.data?.message || "Login failed";
			console.error("Login error:", error);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handle OAuth login
	 * @param {'google' | 'github' | 'discord'} provider
	 */
	const handleOAuthLogin = (provider) => {
		const oauthUrl = apiService.getOAuthUrl(provider);
		window.location.href = oauthUrl;
	};

	if (authLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div>
					<div className='flex justify-center'>
						<div className='w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center'>
							<svg
								className='w-10 h-10 text-white'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
								/>
							</svg>
						</div>
					</div>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100'>Sign in to ZiLink</h2>
					<p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>Manage your IoT devices with ease</p>
				</div>

				<div className='bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg sm:px-10'>
					{/* OAuth Login Buttons */}
					<div className='space-y-3'>
						<button
							onClick={() => handleOAuthLogin("google")}
							className='w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'>
							<svg
								className='w-5 h-5 mr-3'
								viewBox='0 0 24 24'>
								<path
									fill='currentColor'
									d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
								/>
								<path
									fill='currentColor'
									d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
								/>
								<path
									fill='currentColor'
									d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
								/>
								<path
									fill='currentColor'
									d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
								/>
							</svg>
							Continue with Google
						</button>

						<button
							onClick={() => handleOAuthLogin("github")}
							className='w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'>
							<svg
								className='w-5 h-5 mr-3'
								fill='currentColor'
								viewBox='0 0 24 24'>
								<path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
							</svg>
							Continue with GitHub
						</button>

						<button
							onClick={() => handleOAuthLogin("discord")}
							className='w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'>
							<svg
								className='w-5 h-5 mr-3'
								fill='currentColor'
								viewBox='0 0 24 24'>
								<path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
							</svg>
							Continue with Discord
						</button>
					</div>

					<div className='mt-6'>
						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-gray-300' />
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-2 bg-white text-gray-500'>Or continue with email</span>
							</div>
						</div>
					</div>

					{/* Email Login Form */}
					<form
						className='mt-6 space-y-6'
						onSubmit={handleEmailLogin}>
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'>
								Email address
							</label>
							<div className='mt-1'>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-300 dark:text-gray-100'
									placeholder='Enter your email'
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'>
								Password
							</label>
							<div className='mt-1'>
								<input
									id='password'
									name='password'
									type='password'
									autoComplete='current-password'
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-300 dark:text-gray-100'
									placeholder='Enter your password'
								/>
							</div>
						</div>

						<div>
							<button
								type='submit'
								disabled={isLoading}
								className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200'>
								{isLoading ?
									<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
								:	"Sign in"}
							</button>
						</div>
					</form>

					<div className='mt-6'>
						<div className='text-center'>
							<span className='text-sm text-gray-600 dark:text-gray-400'>
								Don't have an account?{" "}
								<Link
									href='/auth/sign-up'
									className='font-medium text-blue-600 hover:text-blue-500 transition duration-200'>
									Sign up
								</Link>
							</span>
						</div>
					</div>
				</div>

				<div className='text-center'>
					<p className='text-xs text-gray-500 dark:text-gray-400'>
						By signing in, you agree to our{" "}
						<Link
							href='/terms'
							className='text-blue-600 hover:text-blue-500'>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							href='/privacy'
							className='text-blue-600 hover:text-blue-500'>
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
