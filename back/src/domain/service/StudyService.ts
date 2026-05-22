import { DateUtils } from '../utils/DateUtils';
import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class StudyService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;
  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getStudies = () => {
    return this.portfolioDataRetrieverPort.getStudies().sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getStudiesByYear = (_root: any, { year }: any) => {
    return this.getStudies()
      .filter((item) => DateUtils.filterItemsByYear(item, year))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };
}
