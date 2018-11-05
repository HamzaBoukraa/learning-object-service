import { enforceWhitelist } from './whitelist';

describe('enforceWhitelist', () => {
  it('should confirm that the username skaza is on the whitelist', async done => {
    await expect(enforceWhitelist('skaza')).resolves.toBe(true);
    done();
  });
  it('should confirm that the username notanactualusername is not on the whitelist', async done => {
    await expect(enforceWhitelist('notanactualusername')).resolves.toBe(false);
    done();
  });
});
