import { describe, expect, jest, test } from '@jest/globals';
import { MissionService } from '../../../src/domain/service/MissionService';
import { DateUtils } from '../../../src/domain/utils/DateUtils';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { MISSION_1, MISSION_2, MISSIONS } from '../data/mission';
import { YEAR_TO_SEARCH } from '../data/common';
import { SKILL_TO_SEARCH } from '../data/skill';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
jest.spyOn(DateUtils, 'compareItemsByStartYearAndEndYear').mockImplementation(() => 1);
jest.spyOn(DateUtils, 'filterItemsByYear').mockImplementation((item, year) => true);
const missionService = new MissionService(portfolioDataRetrieverPort);

describe('getMissions', () => {
  test('should return all existing missions in the right order', () => {
    const expected = MISSIONS;
    const result = missionService.getMissions();
    expect(result).toEqual(expected);
  });
});

describe('getMissionsBySkill', () => {
  test('should return all the missions by skill in the right order', () => {
    const skillName = SKILL_TO_SEARCH;
    const expected = [MISSION_1, MISSION_2];
    const result = missionService.getMissionsBySkill({}, { skillName });
    expect(result).toEqual(expected);
  });
});

describe('getMissionsByYear', () => {
  test('should return all the missions by year in the right order', () => {
    const year = YEAR_TO_SEARCH;
    const expected = MISSIONS;
    const result = missionService.getMissionsByYear({}, { year });
    expect(result).toEqual(expected);
  });
});
