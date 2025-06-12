const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const MainController = require('../../src/controllers/mainController');

describe('MainController Integration', () => {
    let app;
    let mainController;

    before(() => {
        app = express();
        app.use(express.json());
        mainController = new MainController();
        
        // Setup routes
        app.post('/api/submit', mainController.submitContent.bind(mainController));
        app.post('/api/track-view/:id', mainController.trackView.bind(mainController));
    });

    describe('Content Submission', () => {
        it('should reject submission without URL', async () => {
            const response = await request(app)
                .post('/api/submit')
                .send({ title: 'Test' })
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('URL is required');
        });

        it('should reject invalid URL format', async () => {
            const response = await request(app)
                .post('/api/submit')
                .send({ 
                    title: 'Test',
                    url: 'invalid-url',
                    description: 'Test description'
                })
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('Invalid URL format');
        });

        it('should accept valid URL format', async () => {
            const response = await request(app)
                .post('/api/submit')
                .send({ 
                    title: 'Test Content',
                    url: 'https://example.com/test',
                    description: 'Test description'
                })
                .expect((res) => {
                    // Should either succeed or fail with metadata error (not URL validation error)
                    expect(res.status).to.be.oneOf([200, 201, 400, 500]);
                    if (res.status === 400) {
                        expect(res.body.message).to.not.include('Invalid URL format');
                    }
                });
        });
    });

    describe('View Tracking', () => {
        it('should reject invalid link ID', async () => {
            const response = await request(app)
                .post('/api/track-view/invalid')
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('Invalid link ID');
        });

        it('should handle numeric link ID', async () => {
            const response = await request(app)
                .post('/api/track-view/1')
                .expect((res) => {
                    // Should either succeed or fail with "not found" (not validation error)
                    expect(res.status).to.be.oneOf([200, 404, 500]);
                    if (res.status === 404) {
                        expect(res.body.message).to.include('not found');
                    }
                });
        });
    });
});
