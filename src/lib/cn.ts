/**
 * Joins class-name fragments, skipping falsy values.
 * Small local substitute for the common `clsx`/`cn` helper — kept
 * dependency-free since the approved stack doesn't list one.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
