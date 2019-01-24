import { MOCK_OBJECTS } from '../tests/mocks';
import { verifyAccessGroup } from './authGuard';

describe('verifyAccessGroup', () => {
  it('should throw an error', () => {
    expect(() => {
        verifyAccessGroup([''], MOCK_OBJECTS.ACCESS_GROUPS)
    }).toThrow();
  });
  it('Should allow access', () => {
    expect(() => {
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS, MOCK_OBJECTS.ACCESS_GROUPS)
    }).not.toThrow();
  })
});

