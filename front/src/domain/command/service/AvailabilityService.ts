import { AvailabilityPort } from '../port/data/AvailabilityPort';
import { ErrorService } from './ErrorService';
import { AvailabilityFormatterPort } from '../port/format/AvailabilityFormatterPort';

export class AvailabilityService {
  private availabilityPort: AvailabilityPort;
  private availabilityFormatterPort: AvailabilityFormatterPort;
  private errorService: ErrorService;

  constructor(
    availabilityPort: AvailabilityPort,
    availabilityFormatterPort: AvailabilityFormatterPort,
    errorService: ErrorService,
  ) {
    this.availabilityPort = availabilityPort;
    this.availabilityFormatterPort = availabilityFormatterPort;
    this.errorService = errorService;
  }

  async availability(parameter: string): Promise<string> {
    if (!parameter) {
      return this.availabilityFormatterPort.format(await this.availabilityPort.getAvailability());
    }
    return await this.errorService.parameterError('description');
  }
}
