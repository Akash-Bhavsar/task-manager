"use client";

import React from "react";
import Link from "next/link";
import { logoutUser } from "@/lib/api/auth";
import { useAuth } from "@/app/layouts/AuthProvider";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
    const { isLoggedIn, user, reloadUser } = useAuth();

    const router = useRouter();
    const handleLogout = async () => {
        try {
            await logoutUser();
            await reloadUser();
            router.push("/home");
        } catch (err) {
            if (err instanceof Error) {
                console.error("Login error:", err.message);
            }
        }
    };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    return (
        <header className="bg-green-50 text-white p-4">
            <div className="container mx-auto flex items-center justify-between">
                <Link href="/" className="text-green-500 text-2xl font-bold">
                    Task Manager
                </Link>
                <nav>
                    <div className="relative flex items-center justify-between">
                        {/* Mobile menu button - only visible on small screens */}
                        <div className="sm:hidden">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md p-2 text-green-500 hover:bg-green-100"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} w-6 h-6`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                                <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} w-6 h-6`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Desktop navigation */}
                        <div className="hidden sm:ml-6 sm:flex">
                            <div className="flex space-x-4">
                                <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-100">
                                    Home
                                </Link>
                                {isLoggedIn && (
                                    <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-100">
                                        Dashboard
                                    </Link>
                                )}
                                {!isLoggedIn ? (
                                    <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-100">
                                        Login / Sign Up
                                    </Link>
                                ) : (
                                    <div className="flex items-center">
                                        <div className="relative ml-3 flex items-center">
                                            <div className="flex rounded-full bg-green-100 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <span className="ml-2 text-green-500 text-sm font-medium">{user?.username}</span>
                                            <button onClick={handleLogout} className="ml-4 rounded-md px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-100">
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {isMobileMenuOpen && (
                        <div className="sm:hidden">
                            <div className="space-y-1 px-2 pt-2 pb-3">
                                <Link href="/" className="block rounded-md px-3 py-2 text-base font-medium text-green-500 hover:bg-green-100">
                                    Home
                                </Link>
                                {!isLoggedIn && (
                                    <Link href="/dashboard" className="block rounded-md px-3 py-2 text-base font-medium text-green-500 hover:bg-green-100">
                                        Dashboard
                                    </Link>
                                )}
                                {!isLoggedIn ? (
                                    <Link href="/login" className="block rounded-md px-3 py-2 text-base font-medium text-green-500 hover:bg-green-100">
                                        Login / Sign Up
                                    </Link>
                                ) : (
                                    <button onClick={handleLogout} className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-green-500 hover:bg-green-100">
                                        Logout ({user?.username})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
