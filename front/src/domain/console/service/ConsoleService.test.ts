import { ConsoleService, PRISMJACK_PATH } from './ConsoleService';
import { AdviseService } from './AdviseService';

describe('prismjack command', () => {
  const unused = {} as any;
  const navigateTo = jest.fn();
  const service = new ConsoleService(
    unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused,
    { navigateTo },
  );

  it('sends the visitor to the game', async () => {
    const response = await service.submitCommand('prismjack');
    expect(navigateTo).toHaveBeenCalledWith(PRISMJACK_PATH);
    expect(response).toContain('Prismjack');
  });

  it('is suggested by tab completion', () => {
    expect(new AdviseService().adviseCommandsWhoStartWith('pr')).toEqual(['prismjack', 'projects']);
  });
});
