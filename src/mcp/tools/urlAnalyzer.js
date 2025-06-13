import { crawlMetadataBatch } from './urlCrawler.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Analyze URLs and organize metadata into structured format
export async function analyzeUrls(urls) {
  try {
    // Use existing batch crawler
    const crawlResults = await crawlMetadataBatch(urls);
    
    // Extract successful results
    const successfulCrawls = crawlResults.results.filter(r => r.status === 'success');
    
    // Organize by domain
    const byDomain = {};
    const byContentType = {};
    const statistics = {
      totalUrls: urls.length,
      successful: successfulCrawls.length,
      failed: crawlResults.results.filter(r => r.status === 'error').length,
      domains: new Set(),
      contentTypes: new Set(),
      averageWordCount: 0,
      totalLinks: { internal: 0, external: 0 }
    };

    // Process each successful crawl
    successfulCrawls.forEach(result => {
      const { url, metadata } = result;
      const domain = new URL(url).hostname;
      const contentType = metadata.type || 'website';

      // Group by domain
      if (!byDomain[domain]) {
        byDomain[domain] = [];
      }
      byDomain[domain].push(result);

      // Group by content type
      if (!byContentType[contentType]) {
        byContentType[contentType] = [];
      }
      byContentType[contentType].push(result);

      // Update statistics
      statistics.domains.add(domain);
      statistics.contentTypes.add(contentType);
      statistics.averageWordCount += metadata.wordCount || 0;
      statistics.totalLinks.internal += metadata.links?.internal || 0;
      statistics.totalLinks.external += metadata.links?.external || 0;
    });

    // Calculate averages
    if (successfulCrawls.length > 0) {
      statistics.averageWordCount = Math.round(statistics.averageWordCount / successfulCrawls.length);
    }

    // Convert sets to arrays for JSON
    statistics.domains = Array.from(statistics.domains);
    statistics.contentTypes = Array.from(statistics.contentTypes);

    // Create analysis result
    const analysis = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalUrls: urls.length,
        analyzer: 'url-analyzer-v1.0'
      },
      statistics,
      byDomain,
      byContentType,
      allResults: successfulCrawls,
      errors: crawlResults.results.filter(r => r.status === 'error')
    };

    return analysis;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      analyzedAt: new Date().toISOString()
    };
  }
}

// Save analysis to filesystem
export async function saveAnalysis(analysis, filename = null) {
  try {
    // Create filename if not provided
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `url-analysis-${timestamp}.json`;
    }

    // Ensure analysis directory exists
    const analysisDir = join(process.cwd(), 'data', 'analysis');
    await mkdir(analysisDir, { recursive: true });
    
    const outputPath = join(analysisDir, filename);
    
    // Save analysis
    await writeFile(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
    
    return {
      status: 'success',
      filename,
      path: outputPath,
      domainsAnalyzed: analysis.statistics?.domains?.length || 0,
      urlsProcessed: analysis.statistics?.totalUrls || 0,
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

// Complete URL analysis workflow
export async function analyzeAndSave(urls, filename = null) {
  const analysis = await analyzeUrls(urls);
  
  if (analysis.status === 'error') {
    return analysis;
  }
  
  const saveResult = await saveAnalysis(analysis, filename);
  
  return {
    ...saveResult,
    analysis: {
      domains: analysis.statistics.domains.length,
      contentTypes: analysis.statistics.contentTypes.length,
      averageWordCount: analysis.statistics.averageWordCount,
      successRate: `${Math.round((analysis.statistics.successful / analysis.statistics.totalUrls) * 100)}%`
    }
  };
}
