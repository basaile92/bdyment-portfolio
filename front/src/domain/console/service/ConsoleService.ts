import { FormattedAvailabilityPort } from '../port/FormattedAvailabilityPort';
import { FormattedCertificatePort } from '../port/FormattedCertificatePort';
import { FormattedCompanyPort } from '../port/FormattedCompanyPort';
import { FormattedDescriptionPort } from '../port/FormattedDescriptionPort';
import { FormattedHobbyPort } from '../port/FormattedHobbyPort';
import { FormattedHelpPort } from '../port/FormattedHelpPort';
import { FormattedLanguagePort } from '../port/FormattedLanguagePort';
import { FormattedMissionPort } from '../port/FormattedMissionPort';
import { FormattedProjectPort } from '../port/FormattedProjectPort';
import { FormattedSkillPort } from '../port/FormattedSkillPort';
import { FormattedStudyPort } from '../port/FormattedStudyPort';
import { FormattedErrorCommandPort } from '../port/FormattedErrorCommandPort';

export const AVAILABILITY_COMMAND = 'availability';
export const CERTIFICATES_COMMAND = 'certificates';

export const COMPAGNIES_COMMAND = 'companies';
export const CLEAR_COMMAND = 'clear';
export const DESCRIPTION_COMMAND = 'description';
export const HELP_COMMAND = 'help';
export const HOBBIES_COMMAND = 'hobbies';
export const LANGUAGES_COMMAND = 'languages';
export const MISSIONS_COMMAND = 'missions';
export const PROJECTS_COMMAND = 'projects';
export const SKILLS_COMMAND = 'skills';
export const STUDIES_COMMAND = 'studies';

export const AVAILABLE_COMMANDS = [
  AVAILABILITY_COMMAND,
  CERTIFICATES_COMMAND,
  COMPAGNIES_COMMAND,
  CLEAR_COMMAND,
  DESCRIPTION_COMMAND,
  HELP_COMMAND,
  HOBBIES_COMMAND,
  LANGUAGES_COMMAND,
  MISSIONS_COMMAND,
  PROJECTS_COMMAND,
  SKILLS_COMMAND,
  STUDIES_COMMAND,
];

export class ConsoleService {
  private executionByCommandName: Map<string, (param: string) => Promise<string>>;
  private formattedAvailabilityPort: FormattedAvailabilityPort;
  private formattedCertificatePort: FormattedCertificatePort;
  private formattedCompanyPort: FormattedCompanyPort;
  private formattedDescriptionPort: FormattedDescriptionPort;
  private formattedHobbyPort: FormattedHobbyPort;
  private formattedHelpPort: FormattedHelpPort;
  private formattedLanguagePort: FormattedLanguagePort;
  private formattedMissionPort: FormattedMissionPort;
  private formattedProjectPort: FormattedProjectPort;
  private formattedSkillPort: FormattedSkillPort;
  private formattedStudyPort: FormattedStudyPort;
  private formattedErrorCommandPort: FormattedErrorCommandPort;

  constructor(
    formattedAvailabilityPort: FormattedAvailabilityPort,
    formattedCertificatePort: FormattedCertificatePort,
    formattedCompanyPort: FormattedCompanyPort,
    formattedDescriptionPort: FormattedDescriptionPort,
    formattedHobbyPort: FormattedHobbyPort,
    formattedHelpPort: FormattedHelpPort,
    formattedLanguagePort: FormattedLanguagePort,
    formattedMissionPort: FormattedMissionPort,
    formattedProjectPort: FormattedProjectPort,
    formattedSkillPort: FormattedSkillPort,
    formattedStudyPort: FormattedStudyPort,
    formattedErrorCommandPort: FormattedErrorCommandPort,
  ) {
    this.formattedAvailabilityPort = formattedAvailabilityPort;
    this.formattedCertificatePort = formattedCertificatePort;
    this.formattedCompanyPort = formattedCompanyPort;
    this.formattedDescriptionPort = formattedDescriptionPort;
    this.formattedHobbyPort = formattedHobbyPort;
    this.formattedHelpPort = formattedHelpPort;
    this.formattedLanguagePort = formattedLanguagePort;
    this.formattedMissionPort = formattedMissionPort;
    this.formattedProjectPort = formattedProjectPort;
    this.formattedSkillPort = formattedSkillPort;
    this.formattedStudyPort = formattedStudyPort;
    this.formattedErrorCommandPort = formattedErrorCommandPort;
    this.executionByCommandName = new Map();
    this.executionByCommandName.set(AVAILABILITY_COMMAND, (parameter) =>
      this.formattedAvailabilityPort.getFormattedAvailability(parameter),
    );
    this.executionByCommandName.set(CERTIFICATES_COMMAND, (parameter) =>
      this.formattedCertificatePort.getFormattedCertificates(parameter),
    );
    this.executionByCommandName.set(COMPAGNIES_COMMAND, (parameter) =>
      this.formattedCompanyPort.getFormattedCompanies(parameter),
    );
    this.executionByCommandName.set(DESCRIPTION_COMMAND, (parameter) =>
      this.formattedDescriptionPort.getFormattedDescription(parameter),
    );
    this.executionByCommandName.set(HOBBIES_COMMAND, (parameter) =>
      this.formattedHobbyPort.getFormattedHobbies(parameter),
    );
    this.executionByCommandName.set(HELP_COMMAND, (parameter) => this.formattedHelpPort.getFormattedHelp(parameter));
    this.executionByCommandName.set(LANGUAGES_COMMAND, (parameter) =>
      this.formattedLanguagePort.getFormattedLanguages(parameter),
    );
    this.executionByCommandName.set(MISSIONS_COMMAND, (parameter) =>
      this.formattedMissionPort.getFormattedMissions(parameter),
    );
    this.executionByCommandName.set(PROJECTS_COMMAND, (parameter) =>
      this.formattedProjectPort.getFormattedProjects(parameter),
    );
    this.executionByCommandName.set(SKILLS_COMMAND, (parameter) =>
      this.formattedSkillPort.getFormattedSkills(parameter),
    );
    this.executionByCommandName.set(STUDIES_COMMAND, (parameter) =>
      this.formattedStudyPort.getFormattedStudies(parameter),
    );
  }

  submitCommand(commandLine: string): Promise<string> {
    const arrayCommand = commandLine.split(' ');
    const command = arrayCommand[0];
    const parameter = arrayCommand.length > 1 ? arrayCommand[1] : '';
    const execution = this.executionByCommandName.get(command);
    if (!execution) {
      return this.commandError();
    }
    return execution(parameter);
  }

  private async commandError(): Promise<string> {
    let availableCommands = await this.formattedHelpPort.getFormattedHelp('');
    return new Promise((resolve) =>
      resolve(this.formattedErrorCommandPort.getFormattedErrorCommand(availableCommands)),
    );
  }
}
