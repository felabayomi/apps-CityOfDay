/**
 * Utility functions for time-based content display
 * Determines which card type should be shown based on user's local time
 */

export type CardDisplayType = 'preview' | 'morning' | 'afternoon' | 'evening' | 'bonus' | 'luxury' | 'wildlife';

export interface TimeBasedCard {
  type: CardDisplayType;
  label: string;
  timeRange: string;
  nextChangeTime: string;
}

/**
 * Get the current card type based on user's local time
 * NEW 7-Segment Schedule for 6 Content Cards + Preview:
 * - 12:01 AM - 6:00 AM: City Preview (6h)
 * - 6:00 AM - 9:00 AM: Morning Card (3h)  
 * - 9:00 AM - 12:00 PM: Afternoon Card (3h)
 * - 12:00 PM - 3:00 PM: Evening Card (3h)
 * - 3:00 PM - 6:00 PM: Bonus Card (3h)
 * - 6:00 PM - 9:00 PM: Luxury Card (3h)
 * - 9:00 PM - 12:01 AM: Wildlife Card (3h)
 */
export function getCurrentCardType(): TimeBasedCard {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  // Convert time to minutes for easier comparison
  const currentTimeInMinutes = hour * 60 + minutes;
  
  // Define time ranges in minutes (24-hour format) - 7 segments
  const timeRanges = [
    { start: 0, end: 360, type: 'preview' as CardDisplayType, label: 'City Preview', timeRange: '12:01 AM - 6:00 AM', next: '6:00 AM' }, // 12:01 AM - 6:00 AM (6h)
    { start: 360, end: 540, type: 'morning' as CardDisplayType, label: 'Morning Discovery', timeRange: '6:00 AM - 9:00 AM', next: '9:00 AM' }, // 6:00 AM - 9:00 AM (3h)
    { start: 540, end: 720, type: 'afternoon' as CardDisplayType, label: 'Afternoon Culture', timeRange: '9:00 AM - 12:00 PM', next: '12:00 PM' }, // 9:00 AM - 12:00 PM (3h)
    { start: 720, end: 900, type: 'evening' as CardDisplayType, label: 'Evening Experiences', timeRange: '12:00 PM - 3:00 PM', next: '3:00 PM' }, // 12:00 PM - 3:00 PM (3h)
    { start: 900, end: 1080, type: 'bonus' as CardDisplayType, label: 'Did You Know?', timeRange: '3:00 PM - 6:00 PM', next: '6:00 PM' }, // 3:00 PM - 6:00 PM (3h)
    { start: 1080, end: 1260, type: 'luxury' as CardDisplayType, label: 'Luxury Experiences', timeRange: '6:00 PM - 9:00 PM', next: '9:00 PM' }, // 6:00 PM - 9:00 PM (3h)
    { start: 1260, end: 1440, type: 'wildlife' as CardDisplayType, label: 'Nature & Wildlife', timeRange: '9:00 PM - 12:01 AM', next: '12:01 AM' }, // 9:00 PM - 12:01 AM (3h)
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
    timeRange: '12:01 AM - 6:00 AM',
    nextChangeTime: '6:00 AM'
  };
}

/**
 * Get time until next card change
 */
export function getTimeUntilNextChange(): { hours: number; minutes: number } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Next change times (in 24-hour format) - NEW 7-segment schedule
  const changeTimes = [6, 9, 12, 15, 18, 21]; // 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
  let nextChangeHour = 6; // Default to 6 AM next day
  
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
  
  // If we passed all change times today, next change is 6 AM tomorrow
  if (currentHour >= 21 || (currentHour === 0 && currentMinutes >= 1)) {
    targetHour = 6;
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
  
  // Define time ranges and what comes next - NEW 7-segment schedule
  const timeRanges = [
    { start: 0, end: 360, nextType: 'morning' as CardDisplayType, nextLabel: 'Morning Discovery' }, // Preview -> Morning
    { start: 360, end: 540, nextType: 'afternoon' as CardDisplayType, nextLabel: 'Afternoon Culture' }, // Morning -> Afternoon
    { start: 540, end: 720, nextType: 'evening' as CardDisplayType, nextLabel: 'Evening Experiences' }, // Afternoon -> Evening
    { start: 720, end: 900, nextType: 'bonus' as CardDisplayType, nextLabel: 'Did You Know?' }, // Evening -> Bonus
    { start: 900, end: 1080, nextType: 'luxury' as CardDisplayType, nextLabel: 'Luxury Experiences' }, // Bonus -> Luxury
    { start: 1080, end: 1260, nextType: 'wildlife' as CardDisplayType, nextLabel: 'Nature & Wildlife' }, // Luxury -> Wildlife
    { start: 1260, end: 1440, nextType: 'preview' as CardDisplayType, nextLabel: 'City Preview' }, // Wildlife -> Preview (next day)
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