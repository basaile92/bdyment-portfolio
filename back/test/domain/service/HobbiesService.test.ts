import { describe, expect, test } from '@jest/globals';
import { HobbiesService } from '../../../src/domain/service/HobbiesService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { HOBBIES } from '../data/hobby';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const hobbiesService = new HobbiesService(portfolioDataRetrieverPort);

describe('getHobbies', () => {
  test('should return all existing hobbies', () => {
    const expected = HOBBIES;
    const result = hobbiesService.getHobbies();
    expect(result).toEqual(expected);
  });
});
