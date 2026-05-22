import { describe, expect, test } from '@jest/globals';
import { HelpService } from '../../../src/domain/service/HelpService';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { COMMAND_1, COMMAND_2, COMMAND_3, COMMAND_TO_SEARCH } from '../data/command';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
const helpService = new HelpService(portfolioDataRetrieverPort);

describe('getHelp', () => {
  test('should return all existing commands in alphabetical order', () => {
    const expected = [COMMAND_3, COMMAND_1, COMMAND_2];
    const result = helpService.getHelp();
    expect(result).toEqual(expected);
  });
});

describe('getHelpByCommand', () => {
  test('should return all the companies', () => {
    const commandLabel = COMMAND_TO_SEARCH;
    const expected = COMMAND_1;
    const result = helpService.getHelpByCommand({}, { commandLabel });
    expect(result).toEqual(expected);
  });

  test('should return null', () => {
    const unknownCommandLabel = 'unknown';
    const result = helpService.getHelpByCommand({}, { unknownCommandLabel });
    expect(result).toBeUndefined();
  });
});
