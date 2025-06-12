/**
 * Metadata Service
 * Handles metadata extraction from URLs
 */

const axios = require('axios');
const cheerio = require('cheerio');

class MetadataService {
    async fetchMetadata(url) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            return {
                title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'No title',
                description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
                image: $('meta[property="og:image"]').attr('content') || '',
                url: url
            };
        } catch (error) {
            return {
                title: 'Error loading metadata',
                description: '',
                image: '',
                url: url,
                error: error.message
            };
        }
    }
}

module.exports = MetadataService;
