import { describe, expect, jest, test } from '@jest/globals';
import { CompanyService } from '../../../src/domain/service/CompanyService';
import { DateUtils } from '../../../src/domain/utils/DateUtils';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { COMPANIES } from '../data/company';
import { YEAR_TO_SEARCH } from '../data/common';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
jest.spyOn(DateUtils, 'compareItemsByStartYearAndEndYear').mockImplementation(() => 1);
jest.spyOn(DateUtils, 'filterItemsByYear').mockImplementation((item, year) => true);
const companyService = new CompanyService(portfolioDataRetrieverPort);

describe('getCompanies', () => {
  test('should return all existing companies in the right order', () => {
    const expected = COMPANIES;
    const result = companyService.getCompanies();
    expect(result).toEqual(expected);
  });
});

describe('getCompaniesByYear', () => {
  test('should return all the companies by year in the right order', () => {
    const year = YEAR_TO_SEARCH;
    const expected = COMPANIES;
    const result = companyService.getCompaniesByYear({}, { year });
    expect(result).toEqual(expected);
  });
});
