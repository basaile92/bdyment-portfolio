import { MissionService } from '../../../domain/command/service/MissionService';
import { FormattedMissionPort } from '../../../domain/console/port/FormattedMissionPort';

export class FormattedMissionAdapter implements FormattedMissionPort {
  private missionService: MissionService;

  constructor(missionService: MissionService) {
    this.missionService = missionService;
  }

  getFormattedMissions(parameter: string): Promise<string> {
    return this.missionService.missions(parameter);
  }
}
