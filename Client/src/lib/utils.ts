import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { error?: string } }, message?: string };
    return err?.response?.data?.error || err?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
  }
  return 'Lỗi không xác định.';
}
