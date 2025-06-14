// Minimal Agent for crawling, analyzing, and adding URLs
const axios = require('axios');
const knowledgeTools = require('./tools/knowledgeTools');

async function crawlAndAnalyze(url) {
  // Fetch and analyze URL (minimal)
  try {
    const res = await axios.get(url);
    const title = res.data.match(/<title>(.*?)<\/title>/i)?.[1] || url;
    // Add to knowledgebase
    await knowledgeTools.add({ body: { url, title } }, { json: (d) => d });
    return { url, title };
  } catch (e) {
    return { url, error: true };
  }
}

module.exports = { crawlAndAnalyze };
