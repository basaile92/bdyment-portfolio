import { describe, expect, jest, test } from '@jest/globals';
import { DateUtils } from '../../../src/domain/utils/DateUtils';

describe('compareItemsByYear', () => {
  test('should return positive value', () => {
    const item1 = { year: 1949 };
    const item2 = { year: 1950 };
    const result = DateUtils.compareItemsByYear(item1, item2);
    expect(result).toBeGreaterThan(0);
  });
  test('should return zero value', () => {
    const item1 = { year: 1949 };
    const item2 = { year: 1949 };
    const result = DateUtils.compareItemsByYear(item1, item2);
    expect(result).toEqual(0);
  });
  test('should return negative value', () => {
    const item1 = { year: 1949 };
    const item2 = { year: 1948 };
    const result = DateUtils.compareItemsByYear(item1, item2);
    expect(result).toBeLessThan(0);
  });
});
describe('compareItemsByStartYearAndEndYear', () => {
  test('should return positive value because of start year', () => {
    const item1 = { startYear: 1949, endYear: 1955 };
    const item2 = { startYear: 1950, endYear: 1955 };
    const result = DateUtils.compareItemsByStartYearAndEndYear(item1, item2);
    expect(result).toBeGreaterThan(0);
  });
  test('should return negative value because of start year', () => {
    const item1 = { startYear: 1951, endYear: 1955 };
    const item2 = { startYear: 1950, endYear: 1955 };
    const result = DateUtils.compareItemsByStartYearAndEndYear(item1, item2);
    expect(result).toBeLessThan(0);
  });
  test('should return positive value because of end year', () => {
    const item1 = { startYear: 1941, endYear: 1940 };
    const item2 = { startYear: 1949, endYear: 1955 };
    const result = DateUtils.compareItemsByStartYearAndEndYear(item1, item2);
    expect(result).toBeGreaterThan(0);
  });
  test('should return negative value because of end year', () => {
    const item1 = { startYear: 1941, endYear: 1952 };
    const item2 = { startYear: 1949, endYear: 1930 };
    const result = DateUtils.compareItemsByStartYearAndEndYear(item1, item2);
    expect(result).toBeLessThan(0);
  });
  test('should return 0', () => {
    const item1 = { startYear: 1949, endYear: 1952 };
    const item2 = { startYear: 1949, endYear: 1952 };
    const result = DateUtils.compareItemsByStartYearAndEndYear(item1, item2);
    expect(result).toEqual(0);
  });
});
describe('filterItemsByYear', () => {
  test('date between start year and now should return true with is current', () => {
    jest.spyOn(DateUtils, 'getCurrentYear').mockImplementation(() => 2024);
    const item = { startYear: 1949 };

    const result = DateUtils.filterItemsByYear(item, 1995);
    expect(result).toBeTruthy();
  });
  test('date after now should return false with is current', () => {
    jest.spyOn(DateUtils, 'getCurrentYear').mockImplementation(() => 2024);
    const item = { startYear: 1949 };

    const result = DateUtils.filterItemsByYear(item, 2030);
    expect(result).toBeFalsy();
  });
  test('date before staryear should return false', () => {
    jest.spyOn(DateUtils, 'getCurrentYear').mockImplementation(() => 2024);
    const item = { startYear: 1949 };

    const result = DateUtils.filterItemsByYear(item, 1930);
    expect(result).toBeFalsy();
  });
  test('date between start year and end year should return true', () => {
    jest.spyOn(DateUtils, 'getCurrentYear').mockImplementation(() => 2024);
    const item = { startYear: 1949, endYear: 2020 };

    const result = DateUtils.filterItemsByYear(item, 1995);
    expect(result).toBeTruthy();
  });
  test('date after end year should return false', () => {
    jest.spyOn(DateUtils, 'getCurrentYear').mockImplementation(() => 2024);
    const item = { startYear: 1949, endYear: 2020 };
    const result = DateUtils.filterItemsByYear(item, 2030);
    expect(result).toBeFalsy();
  });
});
describe('getCurrentYear', () => {
  test('should return current year', () => {
    jest.useFakeTimers();
    const expected = 2024;
    jest.setSystemTime(new Date(expected, 11, 30));
    const result = DateUtils.getCurrentYear();
    expect(result).toEqual(expected);
  });
});
