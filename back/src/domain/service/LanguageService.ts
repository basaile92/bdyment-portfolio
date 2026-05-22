import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class LanguageService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getLanguages = () => {
    return this.portfolioDataRetrieverPort.getLanguages();
  };
}
