// Extract comprehensive metadata from webpage
export function extractMetadata($, url) {
  const metadata = {
    title: '',
    description: '',
    author: '',
    image: '',
    favicon: '',
    canonical: '',
    keywords: '',
    language: '',
    siteName: '',
    type: '',
    publishedDate: '',
    modifiedDate: '',
    wordCount: 0,
    links: {
      external: 0,
      internal: 0
    }
  };

  // Title - try multiple sources
  metadata.title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('h1').first().text().trim() ||
                  '';

  // Description
  metadata.description = $('meta[name="description"]').attr('content') ||
                        $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content') ||
                        '';

  // Author
  metadata.author = $('meta[name="author"]').attr('content') ||
                   $('meta[property="article:author"]').attr('content') ||
                   $('meta[name="twitter:creator"]').attr('content') ||
                   $('.author').first().text().trim() ||
                   '';

  // Image
  metadata.image = $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('meta[name="twitter:image:src"]').attr('content') ||
                  '';

  // Favicon
  metadata.favicon = $('link[rel="icon"]').attr('href') ||
                    $('link[rel="shortcut icon"]').attr('href') ||
                    $('link[rel="apple-touch-icon"]').attr('href') ||
                    '/favicon.ico';

  // Canonical URL
  metadata.canonical = $('link[rel="canonical"]').attr('href') ||
                      $('meta[property="og:url"]').attr('content') ||
                      url;

  // Keywords
  metadata.keywords = $('meta[name="keywords"]').attr('content') || '';

  // Language
  metadata.language = $('html').attr('lang') ||
                     $('meta[http-equiv="content-language"]').attr('content') ||
                     $('meta[property="og:locale"]').attr('content') ||
                     '';

  // Site name
  metadata.siteName = $('meta[property="og:site_name"]').attr('content') ||
                     $('meta[name="application-name"]').attr('content') ||
                     '';

  // Content type
  metadata.type = $('meta[property="og:type"]').attr('content') || 'website';

  // Dates
  metadata.publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                          $('meta[name="date"]').attr('content') ||
                          $('time[datetime]').first().attr('datetime') ||
                          '';

  metadata.modifiedDate = $('meta[property="article:modified_time"]').attr('content') ||
                         $('meta[name="last-modified"]').attr('content') ||
                         '';

  // Word count (approximate)
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  metadata.wordCount = textContent ? textContent.split(' ').length : 0;

  // Link analysis
  const baseUrl = new URL(url);
  $('a[href]').each((i, element) => {
    const href = $(element).attr('href');
    try {
      if (href.startsWith('http')) {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === baseUrl.hostname) {
          metadata.links.internal++;
        } else {
          metadata.links.external++;
        }
      } else if (href.startsWith('/')) {
        metadata.links.internal++;
      }
    } catch (e) {
      // Skip invalid URLs
    }
  });

  // Convert relative URLs to absolute
  if (metadata.image && !metadata.image.startsWith('http')) {
    try {
      metadata.image = new URL(metadata.image, url).href;
    } catch (e) {
      metadata.image = '';
    }
  }

  if (metadata.favicon && !metadata.favicon.startsWith('http')) {
    try {
      metadata.favicon = new URL(metadata.favicon, url).href;
    } catch (e) {
      metadata.favicon = '';
    }
  }

  return metadata;
}
