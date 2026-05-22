import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { DescriptionService } from '../../../src/domain/service/DescriptionService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { DESCRIPTION } from '../data/description';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const descriptionService = new DescriptionService(portfolioDataRetrieverPort);

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(1993, 11, 29));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('getDescription', () => {
  test('should return description', () => {
    // GIVEN
    const expected = {
      name: DESCRIPTION.name,
      age: {
        timeInHour: 8760,
        timeInDay: 365,
        timeInYear: 0,
      },
      job: DESCRIPTION.job,
      linkedin: DESCRIPTION.linkedin,
      github: DESCRIPTION.github,
      presentation: DESCRIPTION.presentation,
    };
    // WHEN
    const result = descriptionService.getDescription();
    // THEN
    expect(result).toEqual(expected);
  });
});
