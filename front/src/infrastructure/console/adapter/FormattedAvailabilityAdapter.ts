import { AvailabilityService } from '../../../domain/command/service/AvailabilityService';
import { FormattedAvailabilityPort } from '../../../domain/console/port/FormattedAvailabilityPort';

export class FormattedAvailabilityAdapter implements FormattedAvailabilityPort {
  private availabilityService: AvailabilityService;
  constructor(availabilityService: AvailabilityService) {
    this.availabilityService = availabilityService;
  }

  getFormattedAvailability(parameter: string): Promise<string> {
    return this.availabilityService.availability(parameter);
  }
}
