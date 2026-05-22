import { DescriptionPort } from '../port/data/DescriptionPort';
import { ErrorService } from './ErrorService';
import { DescriptionFormatterPort } from '../port/format/DescriptionFormatterPort';

export class DescriptionService {
  private descriptionPort: DescriptionPort;
  private descriptionFormatterPort: DescriptionFormatterPort;
  private errorService: ErrorService;

  constructor(
    descriptionPort: DescriptionPort,
    descriptionFormatterPort: DescriptionFormatterPort,
    errorService: ErrorService,
  ) {
    this.descriptionPort = descriptionPort;
    this.descriptionFormatterPort = descriptionFormatterPort;
    this.errorService = errorService;
  }

  async description(parameter: string): Promise<string> {
    if (!parameter) {
      return this.descriptionFormatterPort.format(await this.descriptionPort.getDescription());
    }
    return await this.errorService.parameterError('description');
  }
}
