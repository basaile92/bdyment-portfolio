import { ApiAvailabilityAdapter } from '../../infrastructure/command/adapter/api/ApiAvailabilityAdapter';
import { ApiCertificateAdapter } from '../../infrastructure/command/adapter/api/ApiCertificateAdapter';
import { ApiCompanyAdapter } from '../../infrastructure/command/adapter/api/ApiCompanyAdapter';
import { ApiDescriptionAdapter } from '../../infrastructure/command/adapter/api/ApiDescriptionAdapter';
import { ApiHelpAdapter } from '../../infrastructure/command/adapter/api/ApiHelpAdapter';
import { ApiHobbyAdapter } from '../../infrastructure/command/adapter/api/ApiHobbyAdapter';
import { ApiLanguageAdapter } from '../../infrastructure/command/adapter/api/ApiLanguageAdapter';
import { ApiMissionAdapter } from '../../infrastructure/command/adapter/api/ApiMissionAdapter';
import { ApiProjectAdapter } from '../../infrastructure/command/adapter/api/ApiProjectAdapter';
import { ApiSkillAdapter } from '../../infrastructure/command/adapter/api/ApiSkillAdapter';
import { ApiStudyAdapter } from '../../infrastructure/command/adapter/api/ApiStudyAdapter';
import { ErrorHelpAdapter } from '../../infrastructure/command/adapter/error/ErrorHelpAdapter';
import { AvailabilityFormatterAdapter } from '../../infrastructure/command/adapter/format/AvailabilityFormatterAdapter';
import { CertificateFormatterAdapter } from '../../infrastructure/command/adapter/format/CertificateFormatterAdapter';
import { CompanyFormatterAdapter } from '../../infrastructure/command/adapter/format/CompanyFormatterAdapter';
import { DescriptionFormatterAdapter } from '../../infrastructure/command/adapter/format/DescriptionFormatterAdapter';
import { ErrorFormatterAdapter } from '../../infrastructure/command/adapter/format/ErrorFormatterAdapter';
import { HelpFormatterAdapter } from '../../infrastructure/command/adapter/format/HelpFormatterAdapter';
import { HobbyFormatterAdapter } from '../../infrastructure/command/adapter/format/HobbyFormatterAdapter';
import { LanguageFormatterAdapter } from '../../infrastructure/command/adapter/format/LanguageFormatterAdapter';
import { MissionFormatterAdapter } from '../../infrastructure/command/adapter/format/MissionFormatterAdapter';
import { ProjectFormatterAdapter } from '../../infrastructure/command/adapter/format/ProjectFormatterAdapter';
import { SkillFormatterAdapter } from '../../infrastructure/command/adapter/format/SkillFormatterAdapter';
import { StudyFormatterAdapter } from '../../infrastructure/command/adapter/format/StudyFormatterAdapter';
import { FormattedAvailabilityAdapter } from '../../infrastructure/console/adapter/FormattedAvailabilityAdapter';
import { FormattedCertificateAdapter } from '../../infrastructure/console/adapter/FormattedCertificateAdapter';
import { FormattedCompanyAdapter } from '../../infrastructure/console/adapter/FormattedCompanyAdapter';
import { FormattedDescriptionAdapter } from '../../infrastructure/console/adapter/FormattedDescriptionAdapter';
import { FormattedHelpAdapter } from '../../infrastructure/console/adapter/FormattedHelpAdapter';
import { FormattedHobbyAdapter } from '../../infrastructure/console/adapter/FormattedHobbyAdapter';
import { FormattedLanguageAdapter } from '../../infrastructure/console/adapter/FormattedLanguageAdapter';
import { FormattedMissionAdapter } from '../../infrastructure/console/adapter/FormattedMissionAdapter';
import { FormattedProjectAdapter } from '../../infrastructure/console/adapter/FormattedProjectAdapter';
import { FormattedSkillAdapter } from '../../infrastructure/console/adapter/FormattedSkillAdapter';
import { FormattedStudyAdapter } from '../../infrastructure/console/adapter/FormattedStudyAdapter';
import { AvailabilityService } from '../../domain/command/service/AvailabilityService';
import { CertificateService } from '../../domain/command/service/CertificateService';
import { CompanyService } from '../../domain/command/service/CompanyService';
import { DescriptionService } from '../../domain/command/service/DescriptionService';
import { ErrorService } from '../../domain/command/service/ErrorService';
import { HelpService } from '../../domain/command/service/HelpService';
import { HobbyService } from '../../domain/command/service/HobbyService';
import { LanguageService } from '../../domain/command/service/LanguageService';
import { MissionService } from '../../domain/command/service/MissionService';
import { ProjectService } from '../../domain/command/service/ProjectService';
import { SkillService } from '../../domain/command/service/SkillService';
import { StudyService } from '../../domain/command/service/StudyService';
import { AdviseService } from '../../domain/console/service/AdviseService';
import { ConsoleService } from '../../domain/console/service/ConsoleService';
import { FormattedErrorCommandAdapter } from '../../infrastructure/console/adapter/FormattedErrorCommandAdapter';
import { ErrorCommandService } from '../../domain/command/service/ErrorCommandService';
import { ErrorCommandFormatterAdapter } from '../../infrastructure/command/adapter/format/ErrorCommandFormatterAdapter';

const apiAvailabilityAdapter = new ApiAvailabilityAdapter();
const apiCertificateAdapter = new ApiCertificateAdapter();
const apiCompanyAdapter = new ApiCompanyAdapter();
const apiDescriptionAdapter = new ApiDescriptionAdapter();
const apiHelpAdapter = new ApiHelpAdapter();
const apiHobbyAdapter = new ApiHobbyAdapter();
const apiLanguageAdapter = new ApiLanguageAdapter();
const apiMissionAdapter = new ApiMissionAdapter();
const apiProjectAdapter = new ApiProjectAdapter();
const apiSkillAdapter = new ApiSkillAdapter();
const apiStudyAdapter = new ApiStudyAdapter();

const availabilityFormatterAdapter = new AvailabilityFormatterAdapter();
const certificateFormatterAdapter = new CertificateFormatterAdapter();
const companyFormatterAdapter = new CompanyFormatterAdapter();
const descriptionFormatterAdapter = new DescriptionFormatterAdapter();
const errorFormatterAdapter = new ErrorFormatterAdapter();
const helpFormatterAdapter = new HelpFormatterAdapter();
const hobbyFormatterAdapter = new HobbyFormatterAdapter();
const languageFormatterAdapter = new LanguageFormatterAdapter();
const missionFormatterAdapter = new MissionFormatterAdapter();
const projectFormatterAdapter = new ProjectFormatterAdapter();
const skillFormatterAdapter = new SkillFormatterAdapter();
const studyFormatterAdapter = new StudyFormatterAdapter();
const errorCommandFormatterAdapter = new ErrorCommandFormatterAdapter();

const helpService = new HelpService(apiHelpAdapter, helpFormatterAdapter);
const certificateService = new CertificateService(apiCertificateAdapter, certificateFormatterAdapter);
const missionService = new MissionService(apiMissionAdapter, missionFormatterAdapter);
const projectService = new ProjectService(apiProjectAdapter, projectFormatterAdapter);
const skillService = new SkillService(apiSkillAdapter, skillFormatterAdapter);
const errorCommandService = new ErrorCommandService(errorCommandFormatterAdapter);

const errorHelpAdapter = new ErrorHelpAdapter(helpService);
const errorService = new ErrorService(errorHelpAdapter, errorFormatterAdapter);

const availabilityService = new AvailabilityService(apiAvailabilityAdapter, availabilityFormatterAdapter, errorService);
const companyService = new CompanyService(apiCompanyAdapter, companyFormatterAdapter, errorService);
const descriptionService = new DescriptionService(apiDescriptionAdapter, descriptionFormatterAdapter, errorService);
const hobbyService = new HobbyService(apiHobbyAdapter, hobbyFormatterAdapter, errorService);
const languageService = new LanguageService(apiLanguageAdapter, languageFormatterAdapter, errorService);
const studyService = new StudyService(apiStudyAdapter, studyFormatterAdapter, errorService);

const formattedAvailabilityAdapter = new FormattedAvailabilityAdapter(availabilityService);
const formattedCertificateAdapter = new FormattedCertificateAdapter(certificateService);
const formattedCompanyAdapter = new FormattedCompanyAdapter(companyService);
const formattedDescriptionAdapter = new FormattedDescriptionAdapter(descriptionService);
const formattedHelpAdapter = new FormattedHelpAdapter(helpService);
const formattedHobbyAdapter = new FormattedHobbyAdapter(hobbyService);
const formattedLanguageAdapter = new FormattedLanguageAdapter(languageService);
const formattedMissionAdapter = new FormattedMissionAdapter(missionService);
const formattedProjectAdapter = new FormattedProjectAdapter(projectService);
const formattedSkillAdapter = new FormattedSkillAdapter(skillService);
const formattedStudyAdapter = new FormattedStudyAdapter(studyService);
const formattedErrorCommandAdapter = new FormattedErrorCommandAdapter(errorCommandService);

export const adviseService = new AdviseService();
export const consoleService = new ConsoleService(
  formattedAvailabilityAdapter,
  formattedCertificateAdapter,
  formattedCompanyAdapter,
  formattedDescriptionAdapter,
  formattedHobbyAdapter,
  formattedHelpAdapter,
  formattedLanguageAdapter,
  formattedMissionAdapter,
  formattedProjectAdapter,
  formattedSkillAdapter,
  formattedStudyAdapter,
  formattedErrorCommandAdapter,
);
