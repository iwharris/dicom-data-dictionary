import * as exported from '../src';

describe('index', () => {
    describe('tags', () => {
        it('should export some tags', () => {
            expect(Object.keys(exported.tags).length).toBeGreaterThan(0);
        });
    });

    describe('elements', () => {
        it('should export some elements', () => {
            expect(Object.keys(exported.elements).length).toBeGreaterThan(0);
        });
    });

    describe('get_element', () => {
        const group = '0020';
        const element = '0011';
        const tagName = 'SeriesNumber';

        it('should get an element using tag format "(gggg,eeee)"', () => {
            expect(exported.get_element(`(${group},${element})`)).toBeDefined();
        });

        it('should get an element using tag format "gggg,eeee"', () => {
            expect(exported.get_element(`${group},${element}`)).toBeDefined();
        });

        it('should get an element using tag format "ggggeeee"', () => {
            expect(exported.get_element(`${group}${element}`)).toBeDefined();
        });

        it('should get an element using tag name', () => {
            expect(exported.get_element(tagName)).toBeDefined();
        });

        it('should return undefined for a nonexistent tag name', () => {
            expect(exported.get_element('NonexistentTagName')).toBeUndefined();
        });
    });
});
