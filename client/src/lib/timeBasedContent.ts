/**
 * Utility functions for time-based content display
 * Determines which card type should be shown based on user's local time
 */

export type CardDisplayType = 'preview' | 'morning' | 'afternoon' | 'evening' | 'bonus';

export interface TimeBasedCard {
  type: CardDisplayType;
  label: string;
  timeRange: string;
  nextChangeTime: string;
}

/**
 * Get the current card type based on user's local time
 * Schedule:
 * - 12:01 AM - 7:00 AM: City Preview
 * - 7:00 AM - 11:00 AM: Morning Card  
 * - 11:00 AM - 3:00 PM: Afternoon Card
 * - 3:00 PM - 7:00 PM: Evening Card
 * - 7:00 PM - 11:00 PM: Bonus Card
 * - 11:00 PM - 12:01 AM: City Preview
 */
export function getCurrentCardType(): TimeBasedCard {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  // Convert time to minutes for easier comparison
  const currentTimeInMinutes = hour * 60 + minutes;
  
  // Define time ranges in minutes (24-hour format)
  const timeRanges = [
    { start: 0, end: 420, type: 'preview' as CardDisplayType, label: 'City Preview', timeRange: '12:01 AM - 7:00 AM', next: '7:00 AM' }, // 12:01 AM - 7:00 AM
    { start: 420, end: 660, type: 'morning' as CardDisplayType, label: 'Morning Discovery', timeRange: '7:00 AM - 11:00 AM', next: '11:00 AM' }, // 7:00 AM - 11:00 AM  
    { start: 660, end: 900, type: 'afternoon' as CardDisplayType, label: 'Afternoon Culture', timeRange: '11:00 AM - 3:00 PM', next: '3:00 PM' }, // 11:00 AM - 3:00 PM
    { start: 900, end: 1140, type: 'evening' as CardDisplayType, label: 'Evening Experiences', timeRange: '3:00 PM - 7:00 PM', next: '7:00 PM' }, // 3:00 PM - 7:00 PM
    { start: 1140, end: 1380, type: 'bonus' as CardDisplayType, label: 'Did You Know?', timeRange: '7:00 PM - 11:00 PM', next: '11:00 PM' }, // 7:00 PM - 11:00 PM
    { start: 1380, end: 1440, type: 'preview' as CardDisplayType, label: 'City Preview', timeRange: '11:00 PM - 12:01 AM', next: '12:01 AM' }, // 11:00 PM - 11:59 PM
  ];
  
  // Find the current time range
  for (const range of timeRanges) {
    if (currentTimeInMinutes >= range.start && currentTimeInMinutes < range.end) {
      return {
        type: range.type,
        label: range.label,
        timeRange: range.timeRange,
        nextChangeTime: range.next
      };
    }
  }
  
  // Fallback to preview if no match found
  return {
    type: 'preview',
    label: 'City Preview', 
    timeRange: '12:01 AM - 7:00 AM',
    nextChangeTime: '7:00 AM'
  };
}

/**
 * Get time until next card change
 */
export function getTimeUntilNextChange(): { hours: number; minutes: number } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Next change times (in 24-hour format)
  const changeTimes = [7, 11, 15, 19, 23]; // 7 AM, 11 AM, 3 PM, 7 PM, 11 PM
  let nextChangeHour = 7; // Default to 7 AM next day
  
  // Find the next change time
  for (const changeTime of changeTimes) {
    if (currentHour < changeTime || (currentHour === changeTime && currentMinutes < 1)) {
      nextChangeHour = changeTime;
      break;
    }
  }
  
  // Calculate time difference
  let targetHour = nextChangeHour;
  let targetDay = 0;
  
  // If we passed all change times today, next change is 7 AM tomorrow
  if (currentHour >= 23 || (currentHour === 0 && currentMinutes >= 1)) {
    targetHour = 7;
    targetDay = 1;
  }
  
  const target = new Date(now);
  target.setDate(target.getDate() + targetDay);
  target.setHours(targetHour, 0, 0, 0);
  
  const diff = target.getTime() - now.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours: diffHours, minutes: diffMinutes };
}

/**
 * Get the next card type (what's coming next)
 */
export function getNextCardType(): TimeBasedCard {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  // Convert time to minutes for easier comparison
  const currentTimeInMinutes = hour * 60 + minutes;
  
  // Define time ranges and what comes next
  const timeRanges = [
    { start: 0, end: 420, nextType: 'morning' as CardDisplayType, nextLabel: 'Morning Discovery' }, // Preview -> Morning
    { start: 420, end: 660, nextType: 'afternoon' as CardDisplayType, nextLabel: 'Afternoon Culture' }, // Morning -> Afternoon
    { start: 660, end: 900, nextType: 'evening' as CardDisplayType, nextLabel: 'Evening Budget Tips' }, // Afternoon -> Evening
    { start: 900, end: 1140, nextType: 'bonus' as CardDisplayType, nextLabel: 'Did You Know?' }, // Evening -> Bonus
    { start: 1140, end: 1380, nextType: 'preview' as CardDisplayType, nextLabel: 'City Preview' }, // Bonus -> Preview
    { start: 1380, end: 1440, nextType: 'morning' as CardDisplayType, nextLabel: 'Morning Discovery' }, // Preview -> Morning (next day)
  ];
  
  // Find the current time range and return what's next
  for (const range of timeRanges) {
    if (currentTimeInMinutes >= range.start && currentTimeInMinutes < range.end) {
      return {
        type: range.nextType,
        label: range.nextLabel,
        timeRange: '', // Not needed for next card display
        nextChangeTime: '' // Not needed for next card display
      };
    }
  }
  
  // Fallback to morning if no match found
  return {
    type: 'morning',
    label: 'Morning Discovery',
    timeRange: '',
    nextChangeTime: ''
  };
}

/**
 * Format time until next change for display
 */
export function formatTimeUntilNext(): string {
  const { hours, minutes } = getTimeUntilNextChange();
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
}