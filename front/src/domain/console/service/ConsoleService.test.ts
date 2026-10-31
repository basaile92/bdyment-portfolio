import { ConsoleService, HEIST_PATH } from './ConsoleService';
import { AdviseService } from './AdviseService';

describe('heist command', () => {
  const unused = {} as any;
  const navigateTo = jest.fn();
  const service = new ConsoleService(
    unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused,
    { navigateTo },
  );

  it('sends the visitor to the game', async () => {
    const response = await service.submitCommand('heist');
    expect(navigateTo).toHaveBeenCalledWith(HEIST_PATH);
    expect(response).toContain('Le Casse');
  });

  it('is suggested by tab completion', () => {
    expect(new AdviseService().adviseCommandsWhoStartWith('he')).toEqual(['heist', 'help']);
  });
});
