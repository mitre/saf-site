import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Map content status to Badge variant
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'

export function getStatusVariant(status?: string): BadgeVariant {
  const variantMap: Record<string, BadgeVariant> = {
    'active': 'success',
    'beta': 'warning',
    'deprecated': 'destructive',
    'draft': 'secondary'
  }
  return variantMap[status?.toLowerCase() ?? ''] ?? 'default'
}
