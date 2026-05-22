import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class SkillService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getSkills = () => {
    const skillsProjects = this.portfolioDataRetrieverPort.getProjects().flatMap((project) => project.skills);
    const skillsMissions = this.portfolioDataRetrieverPort.getMissions().flatMap((mission) => mission.skills);
    const allSkills = skillsProjects.concat(skillsMissions);
    return [...new Map(allSkills.map((item) => [item.name, item])).values()];
  };

  getSkillsByCategory = (_root: any, { category }: any) => {
    const skillsProjects = this.portfolioDataRetrieverPort.getProjects().flatMap((project) => project.skills);
    const skillsMissions = this.portfolioDataRetrieverPort.getMissions().flatMap((mission) => mission.skills);
    const allSkills = skillsProjects.concat(skillsMissions);
    return [...new Map(allSkills.map((item) => [item.name, item])).values()].filter(
      (item) => item.category === category,
    );
  };
}
