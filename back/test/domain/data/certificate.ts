import { Certificate } from '../../../src/domain/model/model';
import { SKILL_TO_SEARCH } from './skill';

export const CERTIFICATE_1: Certificate = { certifier: 'certifier1', skill: SKILL_TO_SEARCH, year: 1, link: 'link1' };
export const CERTIFICATE_2: Certificate = { certifier: 'certifier2', skill: SKILL_TO_SEARCH, year: 2, link: 'link2' };
export const CERTIFICATE_3: Certificate = { certifier: 'certifier3', skill: 'skill3', year: 3, link: 'link3' };
export const CERTIFICATES: Certificate[] = [CERTIFICATE_1, CERTIFICATE_2, CERTIFICATE_3];
