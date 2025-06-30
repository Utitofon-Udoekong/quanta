'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUserStore } from '@/app/stores/user';

export default function LandingPage() {
    
  const { user } = useUserStore();
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0A0C10] via-[#18122B] to-black text-white font-sans">
            {/* Header */}
            <header className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-6">
                <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">ZENTEX</div>
                <nav className="hidden md:flex gap-10 text-white/80 text-base font-medium">
                    <Link href="/" className="hover:text-white transition">Home</Link>
                    <Link href="#how-it-works" className="hover:text-white transition">How it works</Link>
                    <Link href="#features" className="hover:text-white transition">Features</Link>
                </nav>
                {user ? (
                    <Link href="/discover" className="px-7 py-2 rounded-full bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white font-semibold shadow-lg hover:from-[#8B25FF] hover:to-[#350FDD] transition">Discover</Link>
                ) : (
                    <Link href="/auth" className="px-7 py-2 rounded-full bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white font-semibold shadow-lg hover:from-[#8B25FF] hover:to-[#350FDD] transition">Register</Link>
                )}
            </header>

            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center pt-28 pb-20 px-4 md:px-0 text-center relative z-10">
                <img src="/images/hero-gradient.png" alt="Hero Image" className="absolute top-0 left-0 w-full h-full -z-10" />
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
                    A platform built for creators who want full control and full payout
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
                    Sell your content directly, set your own prices, and keep more of what you earn: no gatekeepers, no hidden fees, just pure creator freedom.
                </p>
                <Link href="/discover" className="px-8 py-3 rounded-full bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white font-semibold text-lg shadow-lg hover:from-[#8B25FF] hover:to-[#350FDD] transition mb-8">Browse Content</Link>
                <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden mt-8">
                    <div className="aspect-video w-full flex items-center justify-center">
                        <Image src="/images/hero.png" alt="Hero Image" width={1000} height={1000} />
                    </div>
                </div>
            </section>

            {/* Trusted Users Stats */}
            <section className="w-full bg-[#101014] py-16 flex flex-col items-center justify-center">
                <div className="text-sm text-gray-300 text-center mb-10">Trusted users worldwide</div>
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div>
                        <div className="text-4xl font-bold text-white mb-2">8000+</div>
                        <div className="text-gray-300 text-base">Total Registered</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-white mb-2">3500+</div>
                        <div className="text-gray-300 text-base">Total Viewers</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-white mb-2">9000+</div>
                        <div className="text-gray-300 text-base">Total Creator</div>
                    </div>
            </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="w-full flex justify-center items-center py-24 pl-4 md:pl-8 bg-transparent">
                <div className="w-full max-w-7xl flex flex-col md:flex-row items-start gap-12">
                    {/* Left: Text */}
                    <div className="flex-1 md:min-w-[320px]">
                        <div className="text-sm font-semibold bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent mb-2">How it works</div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white leading-tight max-w-xl">Discover Ways to Sell Your Content and Start Earning Instantly</h2>
                        <div className="flex">
                            {/* Vertical line */}
                            <div className="hidden md:block w-1 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full mr-8" style={{ minHeight: '180px' }}></div>
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-white">Manage your content</h3>
                                    <p className="text-gray-300 max-w-md">Organize, update, and manage all your videos, files, and digital products in one easy dashboard</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-white">Make payment to view content</h3>
                                    <p className="text-gray-300 max-w-md">Instant access after payment — no delays, no subscriptions, just what you paid for</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Right: Overlapping Images */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Blurred background image */}
                        <div className="absolute md:right-24 right-0 md:top-48 top-24 md:w-md w-full  rounded-2xl z-10">
                            <img src="/images/works-sub.png" className='w-full h-full' alt="Hero Image" />
                        </div>
                        {/* Main dashboard image placeholder */}
                        <div className="md:absolute md:top-0 md:right-0 z-0">
                            <div className="md:w-md w-full  rounded-2xl flex items-center justify-center">
                                <img src="/images/works-dash.png" className='w-full h-full' alt="Hero Image" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-6xl mx-auto py-20 px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-left text-purple-400">Features</h2>
                <h3 className="text-3xl font-bold mb-12 text-white">Powerful Features Built for Creators</h3>
                <div className="grid md:grid-cols-2 md:gap-8 gap-4 mb-4 md:mb-8">
                    <div className='flex items-center gap-4 relative '>
                        <img src="/images/easy.jpg" alt="" className='w-full h-full object-cover' />
                        <div className="bg-black/50 backdrop-blur-sm absolute bottom-0 left-0 w-full p-4 md:p-8 flex flex-col justify-between">
                            <h4 className="text-lg font-semibold mb-2 text-white">Easy Content Upload</h4>
                            <p className="text-white/80">No setup, no stress — just drag, drop, and publish your content in seconds.</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#8B25FF] to-[#350FDD] rounded-xl p-4 md:p-8 shadow-lg flex flex-col justify-end">
                        <h4 className="text-lg font-semibold mb-2 text-white">Audience Engagement Tools</h4>
                        <p className="text-white/90">Stay connected with your audience through comments, notifications, and gamification — build loyalty, boost earnings, and see your success content.</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 relative h-48 md:h-96'>
                    <img src="/images/profile.jpg" alt="" className='w-full h-full object-cover' />
                    <div className="bg-black/50 backdrop-blur-sm absolute bottom-0 left-0 w-full p-4 md:p-8 flex flex-col justify-between">
                        <h4 className="text-lg font-semibold mb-2 text-white">Profile Customization</h4>
                        <p className="text-white/80">Make your creator style pop with custom banners, colors, and branding. Make your online style as personalized, stylish, and unique as your vibe.</p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="max-w-6xl mx-auto py-20 px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">Testimonials</h2>
                <h3 className="text-3xl font-bold mb-12 text-white text-center">What Creators Are Saying</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#18122B] rounded-xl p-4 md:p-8 shadow-lg flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-700 mb-4 flex items-center justify-center text-2xl text-purple-300">PJ</div>
                            <div className="text-white/90 font-semibold mb-2">Paul Jones</div>
                            <div className="text-gray-400 text-sm mb-4">pauljones@email.com</div>
                            <div className="text-white/80 text-base mb-4">I've been using Creator for the past year and it has been a game changer for my digital product business. The streamlined systems and processes have allowed me to focus more on creating content.</div>
                            <a href="#" className="text-purple-400 hover:underline text-sm">Read Case Study →</a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="w-full flex justify-center items-center py-20 px-4">
                <div className="w-full max-w-3xl bg-gradient-to-b from-[#18122B] to-[#101014] rounded-[2.5rem] shadow-2xl border border-[#232347] px-8 py-16 flex flex-col items-center" style={{ boxShadow: '0 4px 32px 0 rgba(80, 60, 180, 0.10), 0 0 0 1px #232347' }}>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center">Feeling Bold or Browsing?</h2>
                    <p className="text-lg text-gray-400 mb-10 text-center">Your next upload or binge might be one click away</p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href="/discover" className="px-8 py-3 rounded-full bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white font-semibold text-lg shadow-lg hover:from-[#8B25FF] hover:to-[#350FDD] transition text-center">Browse Content</a>
                        <a href="/dashboard/content/create" className="flex items-center bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent font-semibold text-lg hover:underline transition text-center">
                            Upload Content
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-[#101014] pt-10 pb-4 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Top Row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                        {/* Left: Logo and Links */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
                            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">ZENTEX</span>
                            <nav className="flex flex-col md:flex-row md:gap-8 gap-4 text-white/80 text-sm">
                                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition">Cookie Policy</a>
                                <a href="#" className="hover:text-white transition">Terms and Condition</a>
                            </nav>
                        </div>
                        {/* Right: Email Input */}
                        <form className="flex items-center w-full md:w-auto" onSubmit={e => e.preventDefault()}>
                            <div className="flex items-center w-full md:w-auto border border-[#8B25FF] rounded-full px-4 py-2 bg-transparent focus-within:ring-2 focus-within:ring-[#8B25FF]">
                                <input
                                    type="email"
                                    placeholder="Enter Your Email"
                                    className="bg-transparent outline-none border-none text-white placeholder-gray-400 flex-1 min-w-0 text-sm"
                                    aria-label="Email address"
                                />
                                <button type="submit" className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-[#8B25FF] hover:bg-[#350FDD] transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-4-4m4 4l-4 4" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* Divider */}
                    <div className="border-t border-[#23232b] my-4" />
                    {/* Bottom Row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs text-gray-400 gap-2">
                        <div>© 2025 Zentex. All rights reserved.</div>
                        <div className="md:text-right">Today: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}