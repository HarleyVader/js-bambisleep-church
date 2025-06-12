const { expect } = require('chai');
const ResponseUtils = require('../../src/utils/responseUtils');

describe('ResponseUtils', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.responseData = data;
                return this;
            },
            statusCode: 200,
            responseData: null
        };
    });

    describe('Success Responses', () => {
        it('should create success response with data', () => {
            const testData = { test: 'data' };
            ResponseUtils.success(mockRes, testData, 'Test success');
            
            expect(mockRes.statusCode).to.equal(200);
            expect(mockRes.responseData.success).to.be.true;
            expect(mockRes.responseData.message).to.equal('Test success');
            expect(mockRes.responseData.data).to.deep.equal(testData);
        });

        it('should create success response without data', () => {
            ResponseUtils.success(mockRes, null, 'Test success');
            
            expect(mockRes.statusCode).to.equal(200);
            expect(mockRes.responseData.success).to.be.true;
            expect(mockRes.responseData.message).to.equal('Test success');
            expect(mockRes.responseData.data).to.be.undefined;
        });
    });

    describe('Error Responses', () => {
        it('should create error response', () => {
            ResponseUtils.error(mockRes, 'Test error', 400);
            
            expect(mockRes.statusCode).to.equal(400);
            expect(mockRes.responseData.success).to.be.false;
            expect(mockRes.responseData.message).to.equal('Test error');
        });

        it('should create validation error response', () => {
            const errors = ['Field required', 'Invalid format'];
            ResponseUtils.validationError(mockRes, 'Validation failed', errors);
            
            expect(mockRes.statusCode).to.equal(400);
            expect(mockRes.responseData.success).to.be.false;
            expect(mockRes.responseData.message).to.equal('Validation failed');
            expect(mockRes.responseData.errors).to.deep.equal(errors);
        });
    });

    describe('Created Response', () => {
        it('should create 201 response for resource creation', () => {
            const testData = { id: 1, name: 'Test' };
            ResponseUtils.created(mockRes, testData, 'Resource created');
            
            expect(mockRes.statusCode).to.equal(201);
            expect(mockRes.responseData.success).to.be.true;
            expect(mockRes.responseData.message).to.equal('Resource created');
            expect(mockRes.responseData.data).to.deep.equal(testData);
        });
    });

    describe('Not Found Response', () => {
        it('should create 404 response', () => {
            ResponseUtils.notFound(mockRes, 'User');
            
            expect(mockRes.statusCode).to.equal(404);
            expect(mockRes.responseData.success).to.be.false;
            expect(mockRes.responseData.message).to.equal('User not found');
        });
    });
});
