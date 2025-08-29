import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, BarChart3, Smartphone, Globe, Users } from "lucide-react";

export default function HomePage() {
	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50'>
			{/* Hero Section */}
			<section className='relative overflow-hidden py-20 sm:py-32'>
				<div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10' />
				<div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center'>
						<Badge className='mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200'>Next-Gen IoT Platform</Badge>
						<h1 className='text-4xl sm:text-6xl font-bold text-gray-900 mb-6'>
							Connect Your World with{" "}
							<span className='bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>ZiLink</span>
						</h1>
						<p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
							The ultimate IoT platform for monitoring, controlling, and analyzing your smart devices. Build custom dashboards,
							get real-time insights, and scale your IoT infrastructure effortlessly.
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Link href='/auth/register'>
								<Button
									size='lg'
									className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'>
									Start Building <ArrowRight className='ml-2 w-4 h-4' />
								</Button>
							</Link>
							<Link href='/auth/login'>
								<Button
									size='lg'
									variant='outline'
									className='border-blue-600 text-black hover:bg-blue-50 bg-transparent'>
									View Dashboard
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className='py-20 bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>Everything You Need for IoT Success</h2>
						<p className='text-lg text-gray-600 max-w-2xl mx-auto'>
							Powerful features designed to make IoT development and management simple, scalable, and secure.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4'>
									<BarChart3 className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Real-time Analytics</h3>
								<p className='text-gray-600'>Monitor your devices with live charts, custom metrics, and intelligent alerts.</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4'>
									<Smartphone className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Custom Dashboards</h3>
								<p className='text-gray-600'>Build personalized dashboards with drag-and-drop widgets tailored to your needs.</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4'>
									<Shield className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Enterprise Security</h3>
								<p className='text-gray-600'>
									Bank-level security with OAuth integration, encrypted connections, and access controls.
								</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4'>
									<Globe className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Global Connectivity</h3>
								<p className='text-gray-600'>Connect devices worldwide with our reliable, low-latency global infrastructure.</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4'>
									<Users className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Team Collaboration</h3>
								<p className='text-gray-600'>Share dashboards, manage permissions, and collaborate with your team seamlessly.</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
							<CardContent className='p-6'>
								<div className='w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4'>
									<Zap className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>Lightning Fast</h3>
								<p className='text-gray-600'>Optimized for speed with real-time updates and instant device responses.</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 bg-gradient-to-r from-blue-600 to-cyan-600'>
				<div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
					<h2 className='text-3xl font-bold text-white mb-4'>Ready to Transform Your IoT Experience?</h2>
					<p className='text-xl text-blue-100 mb-8'>
						Join thousands of developers and businesses building the future with ZiLink.
					</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Link href='/auth/register'>
							<Button
								size='lg'
								className='bg-white text-blue-600 hover:bg-gray-100'>
								Start Free Trial
							</Button>
						</Link>
						<Link href='/auth/login'>
							<Button
								size='lg'
								variant='outline'
								className='border-white text-white hover:bg-white/10 bg-transparent'>
								Sign In to Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-gray-900 text-white py-12'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col md:flex-row justify-between items-center'>
						<div className='flex items-center space-x-2 mb-4 md:mb-0'>
							<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center'>
								<Zap className='w-5 h-5 text-white' />
							</div>
							<span className='text-xl font-bold'>ZiLink</span>
						</div>
						<p className='text-gray-400'>© 2024 ZiLink. Built with ❤️ for the IoT community.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
