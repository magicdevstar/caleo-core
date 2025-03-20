import { parse } from "date-fns";
import logger from "./logger";

export const parseHireDate = (hireDate?: string): Date | undefined => {
  try {
    if (!hireDate) {
      return undefined;
    }
    const parsedDate = parse(hireDate, 'MM/dd/yyyy', new Date());
    return parsedDate;
  } catch (error) {
    logger.warn('Failed to parse date', { error });
    return undefined;
  }
};
