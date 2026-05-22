import { Company } from '../../model/Company';

export interface CompanyPort {
  getCompanies(): Promise<Company[]>;

  getCompaniesByYear(year: number): Promise<Company[]>;
}
