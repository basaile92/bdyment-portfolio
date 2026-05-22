import { isInteger } from '../../utils/type-utils';
import { StudyPort } from '../port/data/StudyPort';
import { ErrorService } from './ErrorService';
import { StudyFormatterPort } from '../port/format/StudyFormatterPort';

export class StudyService {
  private studyPort: StudyPort;
  private studyFormatterPort: StudyFormatterPort;
  private errorService: ErrorService;

  constructor(studyPort: StudyPort, studyFormatterPort: StudyFormatterPort, errorService: ErrorService) {
    this.studyPort = studyPort;
    this.studyFormatterPort = studyFormatterPort;
    this.errorService = errorService;
  }

  async studies(parameter: string): Promise<string> {
    if (!parameter) {
      return this.studyFormatterPort.format(await this.studyPort.getStudies());
    }
    if (isInteger(parameter)) {
      return this.studyFormatterPort.format(await this.studyPort.getStudiesByYear(Number.parseInt(parameter)));
    }
    return this.errorService.parameterError('studies');
  }
}
