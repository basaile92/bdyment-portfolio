import { describe, expect, test } from '@jest/globals';
import { SkillService } from '../../../src/domain/service/SkillService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import {
  CATEGORY_TO_SEARCH,
  SKILL_0,
  SKILL_1,
  SKILL_2,
  SKILL_3,
  SKILL_4,
  SKILL_5,
  SKILL_6,
  SKILL_7
} from '../data/skill';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const skillService = new SkillService(portfolioDataRetrieverPort);

describe('getSkills', () => {
  test('should return all existing skills', () => {
    const expected = [SKILL_0, SKILL_1, SKILL_2, SKILL_3, SKILL_4, SKILL_5, SKILL_6, SKILL_7];
    const result = skillService.getSkills();
    expect(result).toEqual(expected);
  });
});

describe('getSkillsByCategory', () => {
  test('should return all the skills by category', () => {
    const category = CATEGORY_TO_SEARCH;
    const expected = [SKILL_0, SKILL_2, SKILL_5];
    const result = skillService.getSkillsByCategory({}, { category });
    expect(result).toEqual(expected);
  });
});
