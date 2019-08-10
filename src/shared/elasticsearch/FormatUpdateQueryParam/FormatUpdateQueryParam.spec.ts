import { formatUpdateQueryParam } from './FormatUpdateQueryParam';

describe('formatUpdateQueryParam', () => {
    describe('when the function receives an object without nested objects', () => {
      it('should return a string with only root level parameters', () => {
        const query = {
          name: 'test',
          level: 2,
        };
        // tslint:disable-next-line:quotemark
        const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";";
        expect(formatUpdateQueryParam(query)).toBe(formattedString);
      });
    });
    describe('when the function receives an object with nested objects', () => {
      it('should return a string with all parameters in correct depths', () => {
        const query = {
          name: 'test',
          level: 2,
          object: {
            name: 'test',
            level: 2,
          },
        };
        // tslint:disable-next-line:quotemark
        const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";ctx._source.object.name = \"test\";ctx._source.object.level = \"2\";";
        expect(formatUpdateQueryParam(query)).toBe(formattedString);
      });
    });
    describe('when the function receives an object with a nested array of objects', () => {
      it('should return a string with all parameters in correct depths', () => {
        const query = {
          name: 'test',
          level: 2,
          object: [
            {
              name: 'test',
              level: 2,
            },
            {
              name: 'test 2',
              level: 3,
            },
          ],
        };
        // tslint:disable-next-line
        const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";ctx._source.object[0].name = \"test\";ctx._source.object[0].level = \"2\";ctx._source.object[1].name = \"test 2\";ctx._source.object[1].level = \"3\";"
        expect(formatUpdateQueryParam(query)).toBe(formattedString);
      });
    });
    describe('when the function receives an empty object', () => {
      it('should return an empty string', () => {
        const query = {};
        // tslint:disable-next-line
        const formattedString = "";
        expect(formatUpdateQueryParam(query)).toBe(formattedString);
      });
    });
    describe('when the function receives an object with an array of strings', () => {
      it('should return an empty string', () => {
        const query = {
          strings: ['unit', 'test'],
        };
        // tslint:disable-next-line
        const formattedString =  "ctx._source.strings.0 = \"unit\";ctx._source.strings.1 = \"test\";";
        expect(formatUpdateQueryParam(query)).toBe(formattedString);
      });
    });
  });
