import { HobbyService } from '../../../domain/command/service/HobbyService';
import { FormattedHobbyPort } from '../../../domain/console/port/FormattedHobbyPort';

export class FormattedHobbyAdapter implements FormattedHobbyPort {
  private hobbyService: HobbyService;

  constructor(hobbyService: HobbyService) {
    this.hobbyService = hobbyService;
  }

  getFormattedHobbies(parameter: string): Promise<string> {
    return this.hobbyService.hobbies(parameter);
  }
}
