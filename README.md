# 🌸 Bambi Sleep Church

**A real-time community-voted link list for bambisleep themes, creators, and categories.**

Bambi Sleep Church is a comprehensive platform that combines community curation with AI-powered knowledge management. Users can submit, vote on, and discuss bambisleep-related content while the system automatically categorizes and enriches submissions with metadata.

## ✨ Features

- 🗳️ **Real-time Voting System** - Community-driven content ranking
- 👥 **Creator Management** - Dedicated creator profiles and tracking
- 🤖 **AI Knowledge Agent** - Powered by LMStudio MCP integration
- 📊 **Smart Categorization** - Automatic content classification
- 💬 **Comment System** - Community discussions on submissions
- 🔄 **Live Feed** - Real-time updates with Socket.IO
- 🎯 **Platform Detection** - Auto-detects YouTube, SoundCloud, Patreon, etc.
- 📈 **Analytics** - Comprehensive statistics and insights

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **LMStudio** (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   cd js-bambisleep-church
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the application**
   ```
   http://localhost:8888
   ```

### 🎯 First Steps

1. **Submit Content** - Visit `/submit` to add links or creator profiles
2. **Vote & Engage** - Use the voting system to rank content
3. **Explore Feed** - Check `/feed` for real-time community activity
4. **View Stats** - Visit `/stats` for platform analytics

## 📖 Core Usage Guide

### 📝 Content Submission

**Via Web Interface:**
- Navigate to `/submit`
- Paste any URL (YouTube, SoundCloud, Patreon, etc.)
- System automatically detects platform and extracts metadata
- Add title/description or use auto-generated content

**Via API:**
```bash
curl -X POST http://localhost:8888/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtube.com/watch?v=example",
    "title": "Optional title",
    "description": "Optional description"
  }'
```

### 🗳️ Voting System

**Web Interface:**
- Click 👍/👎 buttons on any content
- Real-time vote counts update automatically

**API:**
```bash
curl -X POST http://localhost:8888/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "linkId": 1,
    "voteType": "up",
    "action": "add_upvote",
    "userId": "user123"
  }'
```

### 💬 Comments

**Add Comment:**
```bash
curl -X POST http://localhost:8888/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "linkId": 1,
    "text": "Great content!",
    "author": "Username"
  }'
```

## 🤖 AI Features (LMStudio MCP)

### Setup LMStudio Integration

1. **Install LMStudio** and load a compatible model
2. **Configure the endpoint** in `config/lmstudio-mcp-config.json`:
   ```json
   {
     "lmstudio": {
       "baseUrl": "http://192.168.0.69:7777",
       "model": "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0"
     }
   }
   ```

3. **Start the MCP server**
   ```bash
   npm run mcp:agent
   ```

### AI Capabilities

- **Smart Content Analysis** - Automatic categorization and tagging
- **Knowledge Base Queries** - Ask questions about the community data
- **Content Insights** - Generate analytics and trends
- **Automated Crawling** - AI-powered content discovery

## 📊 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feed` | Get community feed |
| `POST` | `/api/submit` | Submit new content |
| `POST` | `/api/vote` | Cast votes |
| `GET` | `/api/platforms` | Get platform statistics |
| `GET` | `/api/stats` | Get overall statistics |

### Platform Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/platforms/:platform` | Get content by platform |
| `POST` | `/api/metadata` | Extract URL metadata |

### Comments Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/comments/:linkId` | Get comments for content |
| `POST` | `/api/comments` | Add new comment |

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=8888

# LMStudio Configuration (optional)
LMSTUDIO_URL=http://192.168.0.69:7777
LMSTUDIO_MODEL=llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0
```

### Data Storage

The application uses JSON files for data storage:
- `data/links.json` - Submitted content
- `data/creators.json` - Creator profiles
- `data/votes.json` - Voting records
- `data/comments.json` - User comments

## 🎨 Supported Platforms

The system automatically detects and handles:

- **Video:** YouTube, Vimeo, Dailymotion
- **Audio:** SoundCloud, Spotify, Bandcamp
- **Creators:** Patreon, Ko-fi, OnlyFans, SubscribeStar
- **Adult Content:** BambiCloud, HypnoTube, specialized platforms
- **General:** Any website with proper metadata

## 🌐 Real-time Features

### Socket.IO Events

**Client → Server:**
- `vote` - Cast a vote
- `newComment` - Add comment
- `joinFeed` - Join real-time feed
- `creatorVoteCast` - Vote on creator

**Server → Client:**
- `voteUpdated` - Vote count changed
- `commentAdded` - New comment posted
- `linkAdded` - New content submitted
- `newContent` - Broadcast new submissions

## 🛠️ Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run MCP server standalone
npm run mcp:standalone

# Run knowledge agent
npm run mcp:agent
```

### Project Structure

```
src/
├── app.js                 # Main application entry
├── routes/main.js         # Route definitions
├── controllers/           # Request handlers
├── utils/                 # Utility modules
├── agents/               # AI agents
└── mcp/                  # Model Context Protocol
```

## 🔍 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 8888 is available
- Verify Node.js version (v16+)
- Run `npm install` to ensure dependencies

**AI features not working:**
- Verify LMStudio is running and accessible
- Check `config/lmstudio-mcp-config.json` settings
- Ensure model is loaded in LMStudio

**Real-time updates not working:**
- Check browser console for WebSocket errors
- Verify Socket.IO connection in network tab

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/HarleyVader/js-bambisleep-church/issues)
- **Documentation:** Check `/help` endpoint when running
- **Community:** Join the discussion in the app's comment sections

---

**Made with 💖 for the bambisleep community**