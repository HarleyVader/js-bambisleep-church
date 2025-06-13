import axios from 'axios';
import { load } from 'cheerio';
import { extractMetadata } from '../../utils/metadata.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Crawl single URL for metadata
export async function crawlUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URL-Crawler-MCP/1.0)'
      }
    });

    const $ = load(response.data);
    const metadata = extractMetadata($, url);
    
    return {
      url,
      status: 'success',
      metadata,
      crawledAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error.message,
      crawledAt: new Date().toISOString()
    };
  }
}

// Crawl webpage for all links
export async function crawlLinks(url, domainFilter = null) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URL-Crawler-MCP/1.0)'
      }
    });

    const $ = load(response.data);
    const links = [];
    const baseUrl = new URL(url);

    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      try {
        let fullUrl;
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('/')) {
          fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
        } else if (href.startsWith('#')) {
          return; // Skip anchors
        } else {
          fullUrl = new URL(href, url).href;
        }

        const linkUrl = new URL(fullUrl);
        if (domainFilter && !linkUrl.hostname.includes(domainFilter)) {
          return;
        }

        links.push({
          url: fullUrl,
          text,
          domain: linkUrl.hostname
        });
      } catch (e) {
        // Skip invalid URLs
      }
    });

    return {
      sourceUrl: url,
      status: 'success',
      linksFound: links.length,
      links,
      crawledAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      sourceUrl: url,
      status: 'error',
      error: error.message,
      crawledAt: new Date().toISOString()
    };
  }
}

// Batch process multiple URLs
export async function crawlMetadataBatch(urls) {
  const results = [];
  const maxConcurrent = 5; // Limit concurrent requests
  
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(url => crawlUrl(url));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful
    if (i + maxConcurrent < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    status: 'success',
    totalProcessed: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results,
    batchedAt: new Date().toISOString()
  };
}

// Save URL data to JSON file
export async function saveUrlData(data, filename = 'url_data.json') {
  try {
    const outputPath = join(process.cwd(), 'data', filename);
    
    // Ensure data directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
    
    return {
      status: 'success',
      filename,
      path: outputPath,
      itemCount: Array.isArray(data) ? data.length : 1,
      savedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      filename
    };
  }
}
