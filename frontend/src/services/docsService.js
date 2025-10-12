// Documentation API service
import api from './api.js';

export const docsService = {
    // Get list of available documentation files
    async getDocsList() {
        try {
            const response = await api.get('/docs');
            return response.data;
        } catch (error) {
            console.error('Error fetching docs list:', error);
            throw error;
        }
    },

    // Get specific documentation file content
    async getDocContent(filename) {
        try {
            // Ensure .md extension
            const docFile = filename.endsWith('.md') ? filename : `${filename}.md`;
            const response = await api.get(`/docs/${docFile}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching doc ${filename}:`, error);
            throw error;
        }
    }
};

export default docsService;
