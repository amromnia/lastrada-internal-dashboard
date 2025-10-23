import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert 24-hour time string to 12-hour AM/PM format
 * @param time - Time string in format "HH:MM" or "HH:MM:SS"
 * @returns Time string in 12-hour format with AM/PM
 */
export function formatTimeToAMPM(time: string): string {
  // Handle cases where time might include seconds
  const [hoursStr, minutesStr] = time.split(':')
  const hours = parseInt(hoursStr, 10)
  const minutes = minutesStr || '00'
  
  if (isNaN(hours)) return time // Return original if invalid
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${displayHours}:${minutes} ${period}`
}
