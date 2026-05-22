import { Availability } from '../../../../domain/command/model/Availability';
import { AvailabilityFormatterPort } from '../../../../domain/command/port/format/AvailabilityFormatterPort';

export class AvailabilityFormatterAdapter implements AvailabilityFormatterPort {
  format(availability: Availability): string {
    return `<div>Available from <span class="important-value"> ${this.formatDate(availability.date)}</span></div><br/>`;
  }

  private formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
