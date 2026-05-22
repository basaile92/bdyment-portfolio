import { Availability } from '../../model/Availability';

export interface AvailabilityFormatterPort {
  format(availability: Availability): string;
}
