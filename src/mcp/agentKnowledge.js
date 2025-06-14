// Minimal Agent for crawling, analyzing, and adding URLs

import * as knowledgeTools from './tools/knowledgeTools.js';

import axios from 'axios';

export async function crawlAndAnalyze(url) {
  // Fetch and analyze URL (minimal)
  try {
    const res = await axios.get(url);
    const title = res.data.match(/<title>(.*?)<\/title>/i)?.[1] || url;
    // Add to knowledgebase
    await knowledgeTools.add({ body: { url, title } }, { json: (d) => d });
    return { url, title };
  } catch (e) {
    // Return detailed error info
    return { url, error: true, message: e.message || 'Failed to fetch content' };
  }
}
