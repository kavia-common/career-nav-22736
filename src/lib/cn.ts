import { clsx, type ClassValue } from "clsx";

/**
 * PUBLIC_INTERFACE
 * Utility to compose conditional className strings.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
