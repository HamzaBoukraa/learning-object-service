import { valueIsNumber } from './valueIsNumber';

describe('When valueIsNumber is called', () => {
  describe('and it is given a value of null', () => {
    it('should return false', () => {
      const isNumber = valueIsNumber(null);
      expect(isNumber).toBeFalsy();
    });
  });
  describe('and it is given a value of undefined', () => {
    it('should return false', () => {
      const isNumber = valueIsNumber(undefined);
      expect(isNumber).toBeFalsy();
    });
  });
  describe('and it is given a number value', () => {
    it('should return true', () => {
      const isNumber = valueIsNumber(1);
      expect(isNumber).toBeTruthy();
    });
  });
});
