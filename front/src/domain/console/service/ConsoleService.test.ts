import { ConsoleService, LUMIJACK_URL } from './ConsoleService';
import { AdviseService } from './AdviseService';

describe('lumijack command', () => {
  const unused = {} as any;
  const navigateTo = jest.fn();
  const service = new ConsoleService(
    unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused, unused,
    { navigateTo },
  );

  it('sends the visitor to the game', async () => {
    const response = await service.submitCommand('lumijack');
    expect(navigateTo).toHaveBeenCalledWith(LUMIJACK_URL);
    expect(response).toContain('Lumijack');
  });

  it('is suggested by tab completion', () => {
    expect(new AdviseService().adviseCommandsWhoStartWith('lu')).toEqual(['lumijack']);
  });
});
