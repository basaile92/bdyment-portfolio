import { HobbyPort } from '../port/data/HobbyPort';
import { ErrorService } from './ErrorService';
import { HobbyFormatterPort } from '../port/format/HobbyFormatterPort';

export class HobbyService {
  private hobbyPort: HobbyPort;
  private hobbyFormatterPort: HobbyFormatterPort;
  private errorService: ErrorService;

  constructor(hobbyPort: HobbyPort, hobbyFormatterPort: HobbyFormatterPort, errorService: ErrorService) {
    this.hobbyPort = hobbyPort;
    this.hobbyFormatterPort = hobbyFormatterPort;
    this.errorService = errorService;
  }

  async hobbies(parameter: string): Promise<string> {
    if (!parameter) {
      return this.hobbyFormatterPort.format(await this.hobbyPort.getHobbies());
    }
    return this.errorService.parameterError('hobbies');
  }
}
