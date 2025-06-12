const { expect } = require('chai');
const DatabaseService = require('../../src/utils/databaseService');

describe('DatabaseService', () => {
    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = require('../../src/utils/databaseService');
            const instance2 = require('../../src/utils/databaseService');
            expect(instance1).to.equal(instance2);
        });
    });

    describe('Basic Operations', () => {
        beforeEach(() => {
            // Reset test data
            if (DatabaseService.read) {
                DatabaseService.testMode = true;
            }
        });

        it('should handle read operation', () => {
            expect(() => {
                const result = DatabaseService.read('links');
                expect(result).to.be.an('array');
            }).to.not.throw();
        });        it('should handle add operation', () => {
            expect(() => {
                const testItem = { 
                    title: 'Test Item ' + Date.now(), 
                    url: 'https://test-' + Date.now() + '.com' 
                };
                const result = DatabaseService.add('links', testItem);
                // Result could be null (duplicate) or object (success)
                expect(result === null || typeof result === 'object').to.be.true;
            }).to.not.throw();
        });

        it('should handle findById operation', () => {
            expect(() => {
                const result = DatabaseService.findById('links', 1);
                // Should return object or null
                expect(result === null || typeof result === 'object').to.be.true;
            }).to.not.throw();
        });
    });
});
