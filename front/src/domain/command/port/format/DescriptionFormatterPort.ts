import { Description } from '../../model/Description';

export interface DescriptionFormatterPort {
  format(description: Description): string;
}
