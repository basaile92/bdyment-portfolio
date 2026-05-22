import { StudyService } from '../../../domain/command/service/StudyService';

export class FormattedStudyAdapter {
  private studyService: StudyService;

  constructor(studyService: StudyService) {
    this.studyService = studyService;
  }

  getFormattedStudies(parameter: string): Promise<string> {
    return this.studyService.studies(parameter);
  }
}
