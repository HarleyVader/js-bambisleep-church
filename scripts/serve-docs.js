#!/usr/bin/env node
/**
 * BambiSleep™ Church MCP Control Tower - Documentation Server
 * Serves public/docs/ on port 4000 with auto-reload
 * 📚 Development Documentation Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.DOCS_PORT || 4000;
const DOCS_DIR = path.join(__dirname, '..', 'public', 'docs');

// ANSI colors
const COLORS = {
  GREEN: '\x1b[32m',
  CYAN: '\x1b[36m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

/**
 * Convert markdown to basic HTML
 */
function markdownToHtml(markdown, filename) {
  // Very basic markdown conversion for documentation viewing
  let html = markdown
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename} - BambiSleep™ Church Docs</title>
  <style>
    :root {
      --pink: #ff6ec7;
      --cyan: #00ffff;
      --dark: #0a0a0a;
      --gray: #1a1a1a;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: var(--dark);
      color: #e0e0e0;
    }
    
    h1, h2, h3 {
      color: var(--pink);
      border-bottom: 2px solid var(--cyan);
      padding-bottom: 10px;
    }
    
    h1 { font-size: 2.5em; }
    h2 { font-size: 2em; margin-top: 40px; }
    h3 { font-size: 1.5em; }
    
    code {
      background: var(--gray);
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--cyan);
      font-family: 'Courier New', monospace;
    }
    
    pre {
      background: var(--gray);
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 4px solid var(--pink);
    }
    
    pre code {
      background: none;
      padding: 0;
      color: #e0e0e0;
    }
    
    a {
      color: var(--cyan);
      text-decoration: none;
    }
    
    a:hover {
      color: var(--pink);
      text-decoration: underline;
    }
    
    .nav {
      background: var(--gray);
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
      border: 1px solid var(--pink);
    }
    
    .nav a {
      margin-right: 15px;
      display: inline-block;
      padding: 5px 10px;
    }
    
    .emoji {
      font-size: 1.2em;
    }
    
    strong {
      color: var(--pink);
    }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/">🏠 Home</a>
    <a href="/RELIGULOUS_MANTRA.md">🌸 Philosophy</a>
    <a href="/MCP_SETUP_GUIDE.md">✨ MCP Setup</a>
    <a href="/CATGIRL.md">🐱 CatGirl Specs</a>
    <a href="/UNITY_IPC_PROTOCOL.md">🔮 Unity IPC</a>
    <a href="/UNITY_SETUP_GUIDE.md">🎮 Unity Setup</a>
  </div>
  <p>${html}</p>
</body>
</html>`;
}

/**
 * Get directory listing HTML
 */
function getDirectoryListing(dirPath, urlPath) {
  const files = fs.readdirSync(dirPath);
  
  const fileList = files
    .filter(f => !f.startsWith('.'))
    .map(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const icon = stats.isDirectory() ? '📁' : '📄';
      const href = path.join(urlPath, file);
      const size = stats.isDirectory() ? '-' : `${(stats.size / 1024).toFixed(1)} KB`;
      
      return `<tr>
        <td>${icon} <a href="${href}">${file}</a></td>
        <td>${size}</td>
        <td>${stats.mtime.toLocaleDateString()}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BambiSleep™ Church Documentation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #0a0a0a;
      color: #e0e0e0;
    }
    
    h1 {
      color: #ff6ec7;
      border-bottom: 3px solid #00ffff;
      padding-bottom: 15px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1a1a;
      border-radius: 5px;
      overflow: hidden;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #333;
    }
    
    th {
      background: #2a2a2a;
      color: #ff6ec7;
      font-weight: bold;
    }
    
    tr:hover {
      background: #252525;
    }
    
    a {
      color: #00ffff;
      text-decoration: none;
    }
    
    a:hover {
      color: #ff6ec7;
      text-decoration: underline;
    }
    
    .subtitle {
      color: #888;
      margin-top: -10px;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <h1>🌸 BambiSleep™ Church Documentation</h1>
  <p class="subtitle">MCP Control Tower & Unity Cathedral Renderer</p>
  
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Modified</th>
      </tr>
    </thead>
    <tbody>
      ${fileList}
    </tbody>
  </table>
  
  <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
    Server running on port ${PORT} | Ctrl+C to stop
  </p>
</body>
</html>`;
}

/**
 * Request handler
 */
function handleRequest(req, res) {
  let filePath = path.join(DOCS_DIR, req.url === '/' ? '' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(DOCS_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Directory listing
    if (stats.isDirectory()) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getDirectoryListing(filePath, req.url));
      return;
    }

    // File serving
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      // Convert markdown to HTML
      if (ext === '.md') {
        const filename = path.basename(filePath);
        const html = markdownToHtml(content.toString(), filename);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
      }
    });
  });
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`${COLORS.GREEN}${COLORS.BOLD}📚 Documentation Server Started${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}URL: http://localhost:${PORT}${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}Docs: ${DOCS_DIR}${COLORS.RESET}\n`);
  console.log('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${COLORS.YELLOW}Shutting down documentation server...${COLORS.RESET}`);
  server.close(() => {
    console.log(`${COLORS.GREEN}Server stopped${COLORS.RESET}`);
    process.exit(0);
  });
});
