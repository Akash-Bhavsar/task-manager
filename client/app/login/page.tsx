"use client";

import { useState } from "react";
import Link from "next/link";
import { loginUser } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/layouts/AuthProvider";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";
import Card from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";

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
    setToast({ message: "", type: null });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      console.log("Login successful:", data);
      await reloadUser();
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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {toast.message && toast.type && (
        <ErrorPopup
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
          autoClose={true}
          duration={5000}
        />
      )}

      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Log in to your Task Manager account
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="mt-2 w-full">
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}
