import { Study } from '../../../src/domain/model/model';

export const STUDY_1: Study = {
  label: 'label1',
  place: 'place1',
  school: 'school1',
  startYear: 2016,
  endYear: 2018,
  diploma: 'diploma1',
  degree: 'degree1',
};
export const STUDY_2: Study = {
  label: 'label2',
  place: 'place2',
  school: 'school2',
  startYear: 2010,
  endYear: 2016,
  diploma: 'diploma2',
  degree: 'degree2',
};
export const STUDIES: Study[] = [STUDY_1, STUDY_2];
