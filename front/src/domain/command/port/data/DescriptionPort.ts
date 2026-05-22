import { Description } from '../../model/Description';

export interface DescriptionPort {
  getDescription(): Promise<Description>;
}
