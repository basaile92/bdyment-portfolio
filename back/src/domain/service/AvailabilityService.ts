import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class AvailabilityService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;
  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getAvailability = () => {
    return this.portfolioDataRetrieverPort.getAvailability();
  };
}
