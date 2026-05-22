import { Availability } from '../../model/Availability';

export interface AvailabilityPort {
  getAvailability(): Promise<Availability>;
}
