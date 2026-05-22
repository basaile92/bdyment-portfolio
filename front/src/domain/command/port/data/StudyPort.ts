import { Study } from '../../model/Study';

export interface StudyPort {
  getStudies(): Promise<Study[]>;

  getStudiesByYear(year: number): Promise<Study[]>;
}
