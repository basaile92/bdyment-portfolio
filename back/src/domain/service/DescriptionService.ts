import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class DescriptionService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getDescription = () => {
    const description = this.portfolioDataRetrieverPort.getDescription();
    return {
      name: description.name,
      age: this._computeAgeFrom(new Date(description.birthday)),
      job: description.job,
      linkedin: description.linkedin,
      github: description.github,
      presentation: description.presentation,
    };
  };

  _computeAgeFrom = (date: Date) => {
    const timeInMs = Date.now() - date.getTime();
    const timeInH = timeInMs / 1000 / 60 / 60;
    const timeInDay = timeInH / 24;
    const timeInYear = timeInDay / 365.25;

    return {
      timeInHour: Math.floor(timeInH),
      timeInDay: Math.floor(timeInDay),
      timeInYear: Math.floor(timeInYear),
    };
  };
}
