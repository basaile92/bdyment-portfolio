import { describe, expect, test } from '@jest/globals';
import { LanguageService } from '../../../src/domain/service/LanguageService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { LANGUAGES } from '../data/language';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const languageService = new LanguageService(portfolioDataRetrieverPort);

describe('getLanguages', () => {
  test('should return all existing languages', () => {
    const expected = LANGUAGES;
    const result = languageService.getLanguages();
    expect(result).toEqual(expected);
  });
});
