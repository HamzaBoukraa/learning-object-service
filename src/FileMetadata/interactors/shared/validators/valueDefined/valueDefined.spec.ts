import { valueDefined } from './valueDefined';

describe('When valueDefined is called', () => {
  describe('and it is given a value of null', () => {
    it('should return false', () => {
      const valueIsDefined = valueDefined(null);
      expect(valueIsDefined).toBeFalsy();
    });
  });
  describe('and it is given a value that is undefined', () => {
    it('should return false', () => {
      const valueIsDefined = valueDefined(undefined);
      expect(valueIsDefined).toBeFalsy();
    });
  });
  describe('and it is given a truthy value', () => {
    it('should return true', () => {
      const valueIsDefined = valueDefined('hello');
      expect(valueIsDefined).toBeTruthy();
    });
  });
});
