import { describe, expect, test } from '@jest/globals';
import { AvailabilityService } from '../../../src/domain/service/AvailabilityService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { AVAILABILITY } from '../data/availability';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const availabilityService = new AvailabilityService(portfolioDataRetrieverPort);

describe('getAvailability', () => {
  test('should return availability', () => {
    const expected = AVAILABILITY;
    const result = availabilityService.getAvailability();
    expect(result).toEqual(expected);
  });
});
