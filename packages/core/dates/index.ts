/**
 * Adds the given amount of hours to the date.
 */
export const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};
