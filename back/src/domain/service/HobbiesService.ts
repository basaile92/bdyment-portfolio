import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class HobbiesService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getHobbies = () => {
    return this.portfolioDataRetrieverPort.getHobbies();
  };
}
