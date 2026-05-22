import { describe, expect, jest, test } from '@jest/globals';
import { ProjectService } from '../../../src/domain/service/ProjectService';
import { DateUtils } from '../../../src/domain/utils/DateUtils';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { PROJECT_1, PROJECT_2, PROJECTS } from '../data/project';
import { YEAR_TO_SEARCH } from '../data/common';
import { SKILL_TO_SEARCH } from '../data/skill';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
jest.spyOn(DateUtils, 'compareItemsByStartYearAndEndYear').mockImplementation(() => 1);
jest.spyOn(DateUtils, 'filterItemsByYear').mockImplementation((item, year) => true);
const projectService = new ProjectService(portfolioDataRetrieverPort);

describe('getProjects', () => {
  test('should return all existing projects in the right order', () => {
    const expected = PROJECTS;
    const result = projectService.getProjects();
    expect(result).toEqual(expected);
  });
});

describe('getProjectsBySkill', () => {
  test('should return all the projects by skill in the right order', () => {
    const skillName = SKILL_TO_SEARCH;
    const expected = [PROJECT_1, PROJECT_2];
    const result = projectService.getProjectsBySkill({}, { skillName });
    expect(result).toEqual(expected);
  });
});

describe('getProjectsByYear', () => {
  test('should return all the projects by year in the right order', () => {
    const year = YEAR_TO_SEARCH;
    const expected = PROJECTS;
    const result = projectService.getProjectsByYear({}, { year });
    expect(result).toEqual(expected);
  });
});
