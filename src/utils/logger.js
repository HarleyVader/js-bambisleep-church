// Simple, clean logging system
export const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.error(`❌ ${msg}`),
    warn: (msg) => console.warn(`⚠️  ${msg}`),
    debug: (msg, data) => {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
            console.log(`🔍 ${msg}`, data || '');
        }
    }
};
