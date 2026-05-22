import { Study } from '../../model/Study';

export interface StudyFormatterPort {
  format(studies: Study[]): string;
}
