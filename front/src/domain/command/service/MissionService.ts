import { isInteger } from '../../utils/type-utils';
import { MissionPort } from '../port/data/MissionPort';
import { MissionFormatterPort } from '../port/format/MissionFormatterPort';

export class MissionService {
  private missionPort: MissionPort;
  private missionFormatterPort: MissionFormatterPort;

  constructor(missionPort: MissionPort, missionFormatterPort: MissionFormatterPort) {
    this.missionPort = missionPort;
    this.missionFormatterPort = missionFormatterPort;
  }

  async missions(parameter: string): Promise<string> {
    if (!parameter) {
      return this.missionFormatterPort.format(await this.missionPort.getMissions());
    }
    if (isInteger(parameter)) {
      return this.missionFormatterPort.format(await this.missionPort.getMissionsByYear(Number.parseInt(parameter)));
    }
    return this.missionFormatterPort.format(await this.missionPort.getMissionsBySkill(parameter));
  }
}
