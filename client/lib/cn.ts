/**
 * Tiny className joiner — keeps the UI primitives dependency-free.
 * Filters out falsy values so callers can do `cn("base", cond && "extra")`.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
