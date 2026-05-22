import { Company } from '../../../src/domain/model/model';
import { YEAR_TO_SEARCH } from './common';

export const COMPANY_1: Company = {
  name: 'name1',
  website: 'website1',
  role: 'role1',
  startYear: YEAR_TO_SEARCH,
};
export const COMPANY_2: Company = {
  name: 'name2',
  website: 'website2',
  role: 'role2',
  startYear: YEAR_TO_SEARCH - 5,
  endYear: YEAR_TO_SEARCH,
  description: 'description2',
};
export const COMPANY_3: Company = {
  name: 'name3',
  website: 'website3',
  role: 'role3',
  startYear: 2003,
  endYear: 2004,
  description: 'description2',
};
export const COMPANIES: Company[] = [COMPANY_1, COMPANY_2, COMPANY_3];
