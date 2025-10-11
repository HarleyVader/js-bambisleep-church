# 🚀 BambiSleep Church Deployment Guide

## 📋 Quick Deployment Overview

BambiSleep Church features **smart platform-aware configuration** that automatically detects your environment and configures the appropriate endpoints.

## 🖥️ Windows Development Setup

### Prerequisites
- Node.js 18+
- LMStudio running on port 7777
- MongoDB Atlas account

### Installation
```bash
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
```

### Configuration (.env)
```bash
# Server Configuration
PORT=7070
SERVER=0.0.0.0
BASE_URL=http://localhost:7070

# LMStudio URLs (system auto-selects LOCAL on Windows)
LMSTUDIO_URL_LOCAL=http://localhost:7777/v1/chat/completions
LMSTUDIO_URL_REMOTE=http://192.168.0.118:7777/v1/chat/completions
LMSTUDIO_MODEL=llama-3.2-3b-instruct@q3_k_l

# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

### Start Development Server
```bash
npm start  # Automatically uses LMSTUDIO_URL_LOCAL (localhost:7777)
```

## 🐧 Linux Production Deployment

### Server Setup
```bash
# On Linux server (192.168.0.143)
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
```

### Configuration
Uses the same `.env` file - the system automatically detects Linux and uses `LMSTUDIO_URL_REMOTE` to connect to your Windows LMStudio instance.

### Start Production Server
```bash
npm start  # Automatically uses LMSTUDIO_URL_REMOTE (192.168.0.118:7777)
```

## 🔄 Smart Configuration Logic

The system automatically determines which LMStudio URL to use based on:

```javascript
// Automatic platform detection
const isWindows = process.platform === 'win32';
const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(process.env.SERVER);

if (isWindows && isLocalhost) {
    // Use local LMStudio (development)
    url = LMSTUDIO_URL_LOCAL
} else {
    // Use remote LMStudio (production)
    url = LMSTUDIO_URL_REMOTE
}
```

## 🌐 Network Configuration

### LMStudio Accessibility Test
```bash
# Test from Linux server to Windows LMStudio
curl -X GET 'http://192.168.0.118:7777/v1/models' \
  -H 'Authorization: Bearer lm-studio' \
  -H 'Content-Type: application/json'
```

### Firewall Configuration
Ensure Windows firewall allows connections to port 7777 from your Linux server IP.

## 📊 Verification

### Development (Windows)
- Server: `http://localhost:7070`
- LMStudio: `localhost:7777` (local)
- Status: `✅ LMStudio server connected successfully`

### Production (Linux)
- Server: `http://192.168.0.143:7070`
- LMStudio: `192.168.0.118:7777` (remote)
- Status: `✅ LMStudio server connected successfully`

## 🛠️ Available Services

Once deployed, access these endpoints:

- **Main Application** - `http://[server]:7070`
- **Agentic Control Panel** - `http://[server]:7070/agents`
- **Knowledge Base** - `http://[server]:7070/knowledge`
- **MCP Inspector** - `http://[server]:7070/inspector`
- **MCP Endpoint** - `http://[server]:7070/mcp`

## 🔍 Troubleshooting

### Connection Issues
1. **Check LMStudio is running** on Windows machine (192.168.0.118:7777)
2. **Verify network connectivity** from Linux server to Windows machine
3. **Check firewall settings** on Windows machine
4. **Verify environment variables** in `.env` file

### Service Status
```bash
# Check system status
curl http://localhost:7070/api/mcp/status
```

### Log Monitoring
```bash
# View server logs
npm start
# Look for: ✅ LMStudio server connected successfully
```

## 🚀 Production Considerations

### Process Management
```bash
# Use PM2 for production
npm install -g pm2
pm2 start src/server.js --name bambisleep-church
pm2 save
pm2 startup
```

### SSL/HTTPS
Configure reverse proxy (nginx) for HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name at.bambisleep.church;
    
    location / {
        proxy_pass http://localhost:7070;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Monitoring

### Health Checks
- MCP Status: `GET /api/mcp/status`
- LMStudio Health: Automatic monitoring every 30 seconds
- MongoDB: Connection status in server logs

### Performance Metrics
- 43 MCP tools operational
- Autonomous knowledge building system
- Real-time chat capabilities
- Intelligent content discovery

---

**Smart deployment achieved!** Your BambiSleep Church instance will automatically configure itself for the optimal LMStudio connection based on the deployment environment.