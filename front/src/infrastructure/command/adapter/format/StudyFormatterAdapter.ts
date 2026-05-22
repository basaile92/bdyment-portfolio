import { Study } from '../../../../domain/command/model/Study';
import { StudyFormatterPort } from '../../../../domain/command/port/format/StudyFormatterPort';
import { displayDatesAndPlace } from './value-utils';
import { separateByNewLine } from './separation-utils';

export class StudyFormatterAdapter implements StudyFormatterPort {
  format(studies: Study[]): string {
    return studies.map(this.studyToString).reduce(separateByNewLine, '');
  }

  private studyToString(study: Study): string {
    return `<div><div>
            <span class="title">${study.label}</span>
          </div>
          ${displayDatesAndPlace(study.startYear, study.endYear, study.place)}
          <div class="second-italic">${study.school}</div>
          <div>${study.diploma} (${study.degree})</div>
          </div>`;
  }
}
