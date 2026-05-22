export interface FormattedMissionPort {
  getFormattedMissions(parameter: string): Promise<string>;
}
