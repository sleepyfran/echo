/**
 * Adds the given amount of hours to the date.
 */
export const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

/**
 * Adds the given amount of seconds to the date.
 */
export const addSeconds = (date: Date, seconds: number): Date => {
  return new Date(date.getTime() + seconds * 1000);
};
