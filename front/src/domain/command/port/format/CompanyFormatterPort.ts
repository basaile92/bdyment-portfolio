import { Company } from '../../model/Company';

export interface CompanyFormatterPort {
  format(companies: Company[]): string;
}
