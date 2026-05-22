import { describe, expect, jest, test } from '@jest/globals';
import { CertificateService } from '../../../src/domain/service/CertificateService';
import { DateUtils } from '../../../src/domain/utils/DateUtils';
import { PortfolioDataRetrieverPortImpl } from '../port/PortfolioDataRetrieverPortImpl';
import { CERTIFICATE_1, CERTIFICATE_2, CERTIFICATES } from '../data/certificate';
import { SKILL_TO_SEARCH } from '../data/skill';

const portfolioDataRetrieverPort = new PortfolioDataRetrieverPortImpl();
jest.spyOn(DateUtils, 'compareItemsByYear').mockImplementation(() => 1);
const certificateService = new CertificateService(portfolioDataRetrieverPort);

describe('getCertificates', () => {
  test('should return all existing certificates in the right order', () => {
    const expected = CERTIFICATES;
    const result = certificateService.getCertificates();
    expect(result).toEqual(expected);
  });
});

describe('getCertificatesBySkill', () => {
  test('should return the correct certificates for a given skill in the right order', () => {
    const skill = SKILL_TO_SEARCH;
    const expected = [CERTIFICATE_1, CERTIFICATE_2];
    const result = certificateService.getCertificatesBySkill({}, { skill });
    expect(result).toEqual(expected);
  });

  test('should return an empty array for an unknown skill', () => {
    const skill = 'unknownSkill';
    const result = certificateService.getCertificatesBySkill({}, { skill });
    expect(result.length).toEqual(0);
  });
});
