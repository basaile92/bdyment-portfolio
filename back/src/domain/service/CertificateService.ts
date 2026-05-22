import { DateUtils } from '../utils/DateUtils';
import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class CertificateService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getCertificates = () => this.portfolioDataRetrieverPort.getCertificates().sort(DateUtils.compareItemsByYear);

  getCertificatesBySkill = (_root: any, { skill }: any) => {
    return this.getCertificates()
      .filter((certificate) => certificate.skill === skill)
      .sort(DateUtils.compareItemsByYear);
  };
}
