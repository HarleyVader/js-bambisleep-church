// Test configuration loading
import dotenv from 'dotenv';
import config from './src/config/server.js';

dotenv.config();

console.log('Environment Variables:');
console.log('PORT:', process.env.PORT);
console.log('HOST:', process.env.HOST);
console.log('LMS_URL:', process.env.LMS_URL);
console.log('LMS_PORT:', process.env.LMS_PORT);

console.log('\nParsed Configuration:');
console.log('LM Studio Base URL:', config.lmstudio.baseURL);
console.log('Knowledge Storage Path:', config.knowledge.storagePath);

console.log('\n✅ dotenv configuration test complete!');
