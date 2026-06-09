/** Daily check-in snapshot for charts, patterns, and tips personalization. */
export type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
  emotion?: string;
  energyLevel?: number;
};
