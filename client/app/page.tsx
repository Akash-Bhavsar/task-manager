import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  buttonBase,
  buttonVariants,
  buttonSizes,
} from "@/app/components/ui/Button";

export default function Home() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Simple, fast task management
      </span>

      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
        Organize your work,
        <br />
        ship more every day
      </h1>

      <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
        A clean, focused task manager. Capture tasks, track progress, and stay
        on top of what matters — without the clutter.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className={cn(
            buttonBase,
            buttonVariants.primary,
            buttonSizes.lg,
            "group"
          )}
        >
          Get started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/signup"
          className={cn(buttonBase, buttonVariants.secondary, buttonSizes.lg)}
        >
          Create an account
        </Link>
      </div>
    </section>
  );
}
