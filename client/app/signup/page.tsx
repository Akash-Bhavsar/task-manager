// app/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { signupUser } from "@/lib/api/auth";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setToast({ message: "Passwords do not match.", type: "danger" });
            return;
        }
        console.log("Signing up user:", { email, password });

        try {
            await signupUser(email, password);
            setToast({
                message: "Account created successfully! You can now log in.",
                type: "success",
            });

            setEmail("");
            setPassword("");
            setConfirmPassword("");

            // Redirect to login page after a short delay to show the success message
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } catch (error) {
            console.error("Signup error:", error);
            setToast({
                message: "Failed to create account. Please try again.",
                type: "danger",
            });
        }
    };

    // Add this right before the return statement

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-green-50">
            <div className="w-full max-w-md bg-green-50 rounded-lg shadow-md p-6">
                <h1 className="text-gray-700 text-2xl font-bold text-center mb-6">
                    Create an Account
                </h1>

                <form
                    onSubmit={handleSignup}
                    className="flex flex-col space-y-5"
                >
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-gray-700 text-sm font-bold mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full p-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-gray-700 text-sm font-bold mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full p-2 border text-gray-700 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-gray-700 text-sm font-bold mb-1"
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="w-full p-2 border text-gray-700 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="mt-4 text-green-600 text-center">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-green-600 hover:underline"
                    >
                        Log In
                    </Link>
                </p>
            </div>
            {toast && (
                <ErrorPopup
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
