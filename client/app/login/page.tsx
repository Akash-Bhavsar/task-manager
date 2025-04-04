"use client";

import { useState } from "react";
import Link from "next/link";
import { loginUser } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/layouts/AuthProvider";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";

export default function LoginPage() {
    const { reloadUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType | null;
    }>({ message: "", type: null });
    const router = useRouter();

    const handleCloseToast = () => {
        setToast({ message: "", type: "" });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await loginUser(email, password);
            console.log("Login successful:", data);
            await reloadUser();
            // setToast({ message: "Login successful!", type: "success" as ToastType });
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            setToast({
                message:
                    error instanceof Error
                        ? error.message
                        : "Login failed. Please try again.",
                type: "danger" as ToastType,
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-green-50">
            {toast.message && toast.type && (
                <ErrorPopup
                    message={toast.message}
                    type={toast.type}
                    onClose={handleCloseToast}
                    autoClose={true}
                    duration={5000}
                />
            )}

            <div className="w-full max-w-md bg-green-50 rounded-lg shadow-md p-6">
                <h1 className="text-2xl text-gray-700 font-bold mb-4 text-center">
                    Login to Task Manager
                </h1>

                <form
                    onSubmit={handleLogin}
                    className="flex flex-col space-y-5"
                >
                    {/* Email Field */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-gray-700 text-sm font-bold mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="w-full p-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-gray-700 text-sm font-bold mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full p-2 border text-gray-700 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        Log In
                    </button>
                </form>

                <p className="text-gray-600 mt-4 text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-green-500 hover:underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
