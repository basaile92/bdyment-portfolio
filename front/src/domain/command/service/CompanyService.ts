import { isInteger } from '../../utils/type-utils';
import { CompanyPort } from '../port/data/CompanyPort';
import { ErrorService } from './ErrorService';
import { CompanyFormatterPort } from '../port/format/CompanyFormatterPort';

export class CompanyService {
  private companyPort: CompanyPort;
  private companyFormatterPort: CompanyFormatterPort;
  private errorService: ErrorService;

  constructor(companyPort: CompanyPort, companyFormatterPort: CompanyFormatterPort, errorService: ErrorService) {
    this.companyPort = companyPort;
    this.companyFormatterPort = companyFormatterPort;
    this.errorService = errorService;
  }

  async companies(parameter: string): Promise<string> {
    if (!parameter) {
      return this.companyFormatterPort.format(await this.companyPort.getCompanies());
    }
    if (isInteger(parameter)) {
      return this.companyFormatterPort.format(await this.companyPort.getCompaniesByYear(Number.parseInt(parameter)));
    }
    return await this.errorService.parameterError('companies');
  }
}
