import { describe, expect, jest, test } from '@jest/globals';
import { StudyService } from '../../../src/domain/service/StudyService';
import { DateUtils } from '../../../src/domain/utils/DateUtils';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { STUDIES } from '../data/study';
import { YEAR_TO_SEARCH } from '../data/common';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
jest.spyOn(DateUtils, 'compareItemsByStartYearAndEndYear').mockImplementation(() => 1);
jest.spyOn(DateUtils, 'filterItemsByYear').mockImplementation((item, year) => true);
const studyService = new StudyService(portfolioDataRetrieverPort);

describe('getStudies', () => {
  test('should return all existing studies in the right order', () => {
    const expected = STUDIES;
    const result = studyService.getStudies();
    expect(result).toEqual(expected);
  });
});

describe('getStudiesByYear', () => {
  test('should return all the studies by year in the right order', () => {
    const year = YEAR_TO_SEARCH;
    const expected = STUDIES;
    const result = studyService.getStudiesByYear({}, { year });
    expect(result).toEqual(expected);
  });
});
