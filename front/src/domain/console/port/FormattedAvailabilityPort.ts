export interface FormattedAvailabilityPort {
  getFormattedAvailability(parameter: string): Promise<string>;
}
