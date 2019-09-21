import { stringHasContent } from './stringHasContent';

describe('When stringHasContent is called', () => {
  describe('and it is given a value of null', () => {
    it('should return false', () => {
      const hasContent = stringHasContent(null);
      expect(hasContent).toBeFalsy();
    });
  });
  describe('and it is given a value of undefined', () => {
    it('should return false', () => {
      const hasContent = stringHasContent(undefined);
      expect(hasContent).toBeFalsy();
    });
  });
  describe('and it is given a string value of null', () => {
    it('should return false', () => {
      const hasContent = stringHasContent('null');
      expect(hasContent).toBeFalsy();
    });
  });
  describe('and it is given a string value of undefined', () => {
    it('should return false', () => {
      const hasContent = stringHasContent('undefined');
      expect(hasContent).toBeFalsy();
    });
  });
  describe('and it is given a truthy string', () => {
    it('should return true', () => {
      const hasContent = stringHasContent('hello');
      expect(hasContent).toBeTruthy();
    });
  });
});
