import { CompanyService } from '../../../domain/command/service/CompanyService';
import { FormattedCompanyPort } from '../../../domain/console/port/FormattedCompanyPort';

export class FormattedCompanyAdapter implements FormattedCompanyPort {
  private companyService: CompanyService;

  constructor(companyService: CompanyService) {
    this.companyService = companyService;
  }

  getFormattedCompanies(parameter: string): Promise<string> {
    return this.companyService.companies(parameter);
  }
}
