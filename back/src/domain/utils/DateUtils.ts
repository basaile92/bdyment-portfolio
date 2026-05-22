import { DateItem, YearItem } from '../model/model';

export class DateUtils {
  static compareItemsByYear = (item1: YearItem, item2: YearItem) => {
    return item2.year - item1.year;
  };

  static compareItemsByStartYearAndEndYear = (item1: DateItem, item2: DateItem) => {
    if (!item1.endYear) return -1;
    if (!item2.endYear) return 1;
    const endYearComparison = item2!.endYear - item1!.endYear;
    if (endYearComparison === 0) return item2.startYear - item1.startYear;

    return endYearComparison;
  };

  static filterItemsByYear = (item: DateItem, year: number) => {
    return (
      item.startYear <= year &&
      ((!item.endYear && year <= DateUtils.getCurrentYear()) || (item.endYear !== undefined && item.endYear >= year))
    );
  };

  static getCurrentYear = () => {
    return new Date().getFullYear();
  };
}
