import { DescriptionService } from '../../../domain/command/service/DescriptionService';
import { FormattedDescriptionPort } from '../../../domain/console/port/FormattedDescriptionPort';

export class FormattedDescriptionAdapter implements FormattedDescriptionPort {
  private descriptionService: DescriptionService;

  constructor(descriptionService: DescriptionService) {
    this.descriptionService = descriptionService;
  }

  getFormattedDescription(parameter: string): Promise<string> {
    return this.descriptionService.description(parameter);
  }
}
