import { AVAILABLE_COMMANDS } from './ConsoleService';

export class AdviseService {
  adviseACommandWhoStartWith(value: string, index: number) {
    const filteredCommand = this.adviseCommandsWhoStartWith(value);
    if (filteredCommand.length === 0) {
      return '';
    }
    return filteredCommand[index % filteredCommand.length];
  }

  adviseCommandsWhoStartWith(value: string) {
    if (value.length === 0) return AVAILABLE_COMMANDS;
    return AVAILABLE_COMMANDS.filter((command) => command.startsWith(value));
  }
}
