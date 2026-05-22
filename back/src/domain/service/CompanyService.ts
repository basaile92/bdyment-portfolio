import { DateUtils } from '../utils/DateUtils';
import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class CompanyService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getCompanies = () => {
    return this.portfolioDataRetrieverPort.getCompanies().sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getCompaniesByYear = (_root: any, { year }: any) => {
    return this.getCompanies()
      .filter((item) => DateUtils.filterItemsByYear(item, year))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };
}
