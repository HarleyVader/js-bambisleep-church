# 🌟 Bambi Sleep Church - Endless Stream Feed Edition

[![GitHub Repository](https://img.shields.io/badge/GitHub-js--bambisleep--church-blue?logo=github)](https://github.com/HarleyVader/js-bambisleep-church)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Cyberpunk Theme](https://img.shields.io/badge/Theme-Cyberpunk%20Neonwave-ff00ff.svg)](#)

## 🎮 Project Overview

**BambiSleep.church** is a cutting-edge community platform featuring an **endless stream feed** with real-time voting, comments, metadata enhancement, and embedded media players. The application combines modern web technologies with a stunning cyberpunk neonwave theme and includes a **standalone Model Context Protocol (MCP) server** for automated content management.

**🌐 Repository**: https://github.com/HarleyVader/js-bambisleep-church

## ✨ Key Features

### 🤖 **MCP Server Integration**

- **Standalone MCP Server**: No SDK dependencies, pure JSON-RPC 2.0 implementation
- **URL Fetching**: Automated content fetching with metadata extraction
- **Data Management**: Full CRUD operations on all application data
- **Platform Detection**: Smart detection of YouTube, SoundCloud, Vimeo, and more
- **Content Processing**: Automatic title, description, and thumbnail extraction

### 📡 **Live Stream Feed System**

- **Endless Scrolling**: Infinite feed with real-time content updates (`/feed`)
- **Live Updates**: New content appears instantly via Socket.IO
- **Pagination API**: RESTful endpoints for seamless content loading
- **Real-time Broadcasting**: Instant updates for votes, comments, and new submissions
- **Feed Statistics**: Live counters for total links, pages, and community activity

### 🎥 **Embedded Media Players**

- **YouTube Integration**: Native iframe embedding with full playback controls
- **Vimeo Support**: Professional video platform integration
- **SoundCloud Players**: Audio streaming with embedded controls
- **Direct Media Files**: HTML5 audio/video players for MP3, MP4, WebM, etc.
- **Responsive Players**: Auto-scaling media players for all screen sizes
- **Platform Detection**: Automatic player selection based on URL type

### 🤖 **Intelligent Metadata System**

- **Automatic Enhancement**: Real-time metadata fetching for all submitted content
- **Multi-Platform Support**: YouTube, SoundCloud, Vimeo, Patreon, BambiCloud, HypnoTube, adult platforms, direct files
- **Rich Previews**: Thumbnails, titles, descriptions, and platform badges
- **Caching System**: Efficient metadata storage with 24-hour TTL
- **Fallback Handling**: Graceful degradation for unsupported platforms

### 💬 **Advanced Comment System**

- **Real-time Comments**: Live comment posting and updates
- **Comment Voting**: Upvote/downvote system with instant feedback
- **Author Support**: Optional usernames with "Anonymous" fallback
- **Pagination**: Efficient handling of large comment threads
- **CRUD Operations**: Full create, read, update, delete functionality
- **Top Comments**: Intelligent sorting by votes and engagement

### 🗳️ **Community Voting System**

- **Link Voting**: Upvote/downvote content with persistent storage
- **Creator Voting**: Support your favorite content creators
- **Real-time Updates**: Instant vote broadcasting across all clients
- **Vote Statistics**: Community-driven content rankings
- **Anonymous Voting**: No registration required for participation

### 🎨 **Cyberpunk Neonwave Theme**

- **CSS Custom Properties**: Easy color/spacing customization
- **Neon Glow Effects**: Animated borders, text, and interactive elements
- **Holographic Cards**: Interactive content cards with hover effects
- **Glitch Animations**: Matrix-style background elements and scan lines
- **Platform Badges**: Color-coded badges for YouTube, SoundCloud, Vimeo, Patreon
- **Data Stream UI**: Futuristic loading animations and progress indicators

### 📱 **Fully Responsive Design**

- **Mobile-first Architecture**: Optimized for 320px to 4K+ displays
- **Auto-adjusting Grid**: Dynamic 1-4 column layout based on screen size
- **Touch-friendly Interactions**: Optimized spacing and controls for mobile
- **Progressive Enhancement**: Works perfectly across all device types
- **Modern Layout**: Clean borders, consistent spacing, and polished appearance

### 🔄 **Real-time Features**

- **Socket.IO Integration**: Persistent WebSocket connections
- **Live Feed Updates**: New links appear instantly without refresh
- **Real-time Voting**: Vote changes broadcast to all connected users
- **Live Comments**: Comment additions and vote updates in real-time
- **User Connection Tracking**: Monitor active community members
- **Instant Notifications**: Toast messages for user actions and updates

### 🛡️ **Robust Data Management**

- **JSON Database System**: File-based storage with automatic ID generation
- **Duplicate Prevention**: URL-based duplicate detection with user-friendly errors
- **Data Validation**: Comprehensive client and server-side form validation
- **Error Handling**: Graceful error recovery with informative messages
- **Atomic Operations**: Safe concurrent data operations
- **Backup & Recovery**: Persistent data storage with automatic timestamping

### 🎯 **Content Categories & Validation**

- **Audio Content**: SoundCloud, Spotify, YouTube, BambiCloud, HypnoTube, adult platforms (XVideos, XHamster, PornHub), direct audio files (.mp3, .wav, .m4a, .ogg, .flac)
- **Video Content**: YouTube, Vimeo, Dailymotion, BambiCloud, HypnoTube, adult platforms (XVideos, XHamster, PornHub), direct video files (.mp4, .webm, .mov, .avi, .mkv)
- **Creator Profiles**: Patreon, Ko-fi, personal websites, social media
- **Documents & Guides**: PDFs, documents, tutorials, and educational content
- **Smart Validation**: Platform-specific URL validation and content categorization

### 📊 **Analytics & Statistics**

- **Real-time Stats**: Live counters for links, votes, views, and comments
- **Category Breakdown**: Detailed statistics by content type
- **Top Content**: Community-ranked links and creators
- **View Tracking**: Automatic view counting with privacy protection
- **Engagement Metrics**: Comment counts, vote ratios, and activity trends

## 🛠️ Technical Stack

### **Backend Architecture**

- **Runtime**: Node.js with Express.js framework
- **Database**: JSON file-based storage system
- **Real-time**: Socket.IO WebSocket integration
- **Metadata**: Axios HTTP client + Cheerio HTML parsing
- **Validation**: Comprehensive URL and content validation

### **Frontend Technology**

- **Templating**: EJS server-side rendering
- **Styling**: Custom CSS with CSS Custom Properties
- **JavaScript**: Vanilla ES6+ with modern async/await
- **Real-time**: Socket.IO client integration
- **Responsive**: Mobile-first responsive design

### **Key Dependencies**

```json
{
  "express": "^5.1.0",
  "socket.io": "^4.8.1",
  "ejs": "^3.1.10",
  "axios": "^1.9.0",
  "cheerio": "^1.1.0",
  "marked": "^15.0.12"
}
```

## 🚀 Features in Action

1. **Submit New Content** → Automatic metadata fetching → Real-time feed updates
2. **Vote on Content** → Instant vote broadcasting → Live ranking updates  
3. **Comment System** → Real-time comment posting → Live vote updates
4. **Embedded Players** → YouTube/Vimeo iframe embedding → Direct media playback
5. **Infinite Scroll** → Seamless content loading → Performance optimized

## 📡 Complete API Reference

### **Core Application Routes**

- `GET /` - Homepage with community statistics and top content
- `GET /feed` - Live stream feed with infinite scroll
- `GET /submit` - Multi-category content submission form
- `GET /stats` - Comprehensive community statistics dashboard
- `GET /links` - Traditional link listing view

### **Feed & Content API**

- `GET /api/feed` - Paginated feed API for infinite scroll
- `POST /api/feed` - Submit new content to feed
- `GET /api/links` - Retrieve all links with metadata
- `POST /api/links` - Create a new link with validation
- `GET /api/links/:id` - Get specific link details
- `POST /api/links/:id/view` - Track link view (analytics)

### **Comment System API**

- `GET /api/comments/:linkId` - Get all comments for a specific link
- `POST /api/comments` - Create a new comment with author support
- `POST /api/comments/:commentId/vote` - Vote on a comment (up/down)
- `DELETE /api/comments/:commentId` - Delete a comment (moderation)

### **Voting & Community API**

- `POST /api/votes` - Cast a vote for content
- `GET /api/votes/:linkId` - Get vote statistics for a link
- `GET /api/creators` - Get all creators sorted by votes
- `POST /api/creators` - Add a new creator profile
- `POST /api/creators/:id/vote` - Vote for a creator

### **Analytics API**

- `GET /api/stats` - Get comprehensive platform statistics

## 📁 Project Structure

```text
js-bambisleep-church/
├── src/
│   ├── app.js                      # Main application entry point
│   ├── controllers/
│   │   ├── commentController.js    # Comment management
│   │   ├── creatorController.js    # Creator management  
│   │   ├── feedController.js       # Feed functionality
│   │   ├── linkController.js       # Link management
│   │   └── voteController.js       # Voting system
│   ├── routes/
│   │   └── main.js                # Consolidated routes
│   ├── utils/
│   │   ├── jsonDatabase.js        # JSON file database
│   │   ├── metadataService.js     # Metadata fetching
│   │   └── socketHandler.js       # Real-time WebSocket handling
│   └── middleware/                # Custom middleware
├── public/
│   ├── css/
│   │   ├── style.css             # Main cyberpunk theme
│   │   └── feed.css              # Feed-specific styles
│   ├── js/
│   │   ├── main.js               # Core JavaScript
│   │   ├── enhanced-feed.js      # Advanced feed functionality
│   │   ├── voting.js             # Voting system
│   │   ├── unified-submit.js     # Unified submission form
│   │   └── stats.js              # Statistics page
│   └── assets/                   # Media assets and placeholders
├── views/
│   ├── partials/
│   │   ├── header.ejs            # Site header
│   │   └── footer.ejs            # Site footer
│   ├── pages/
│   │   ├── index.ejs             # Unified homepage with platform explorer
│   │   ├── feed.ejs              # Enhanced live feed page
│   │   ├── submit.ejs            # Unified content submission
│   │   ├── links.ejs             # Link listing
│   │   ├── stats.ejs             # Statistics page
│   │   └── categories.ejs        # Category browsing
│   └── components/
│       └── linkCard.ejs          # Reusable link card component
├── data/                         # JSON database files
│   ├── links.json               # Link storage
│   ├── creators.json            # Creator data
│   ├── votes.json               # Vote tracking
│   └── comments.json            # Comment storage
├── config/                       # Configuration files
├── THEME_CUSTOMIZATION.md        # Theme customization guide
├── IMPLEMENTATION_COMPLETE.md    # Implementation documentation
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🔧 Project Status & Scripts

### Current State (June 2025)
- ✅ **Feed System**: Fully functional with platform detection fixed
- ✅ **Platform Display**: Fixed "Unknown" platform issue - now properly shows "soundcloud", etc.
- ✅ **Code Cleanup**: Removed test files and merged duplicate implementations
- ✅ **Feed Implementation**: Consolidated into single enhanced-feed.js with full functionality

### Available Scripts

#### 🎀 Complete Database Setup (SINGLE SCRIPT)
- `complete_bambi_database_setup.js` - **⭐ MAIN SETUP SCRIPT** - All-in-one database population
  - Official Bambi Sleep creators from bambisleep.info
  - Community creators from Patreon (40+ creators with social links)
  - Complete Bambi Daddi SoundCloud collection (10 tracks)
  - ALL Tomtame HypnoTube videos (22 videos with metadata)
  - Usage: `node complete_bambi_database_setup.js [section]`
  - Sections: `official`, `community`, `audio`, `videos`, `all` (default)

*Previous individual scripts have been consolidated for efficiency and maintainability.*

See `SCRIPTS_DOCUMENTATION.md` for detailed usage instructions.

### Recent Improvements
- 🔧 **Platform Detection Fix**: Resolved metadata.platform vs platform data structure issue
- 🧹 **Code Cleanup**: Removed debug/test files, merged feedUtils.js into enhanced-feed.js
- 📝 **Documentation**: Added comprehensive script documentation
- 🎯 **Feed Optimization**: Single source of truth for feed functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   ```

2. Navigate to the project directory:
   ```bash
   cd js-bambisleep-church
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and visit:
   - **Local**: http://localhost:8888
   - **Feed**: http://localhost:8888/feed  
   - **Submit**: http://localhost:8888/submit
   - **Stats**: http://localhost:8888/stats

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

### MCP Server

Run the standalone MCP server:
```bash
npm run mcp
```

Test the MCP server:
```bash
npm run test:mcp
```

Run MCP demonstrations:
```bash
npm run demo:mcp
npm run example:mcp
```

```bash
npm run dev
```

## 🌐 Access Points

- **Homepage**: Complete overview with top content and quick stats
- **Live Feed**: Real-time content stream with infinite scroll  
- **Submit Content**: Multi-category submission form with validation
- **Statistics**: Community analytics and engagement metrics

## 🎯 Key Technologies

**Core Stack:**

- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web framework for Node.js  
- **EJS** - Templating engine for dynamic HTML
- **Socket.IO** - Real-time bidirectional communication
- **JSON Database** - File-based persistent storage
- **CSS Custom Properties** - Modular theme system
- **Responsive Grid** - Mobile-first layout system

**Frontend Features:**

- **Vanilla JavaScript** - Modern ES6+ with async/await
- **Real-time WebSockets** - Live updates and interactions
- **Infinite Scroll** - Seamless content loading
- **Progressive Enhancement** - Works across all device types

## 🎨 Theme Customization

The cyberpunk theme is built with **59 CSS custom properties** for complete customization:

```css
/* Easy color customization */
--color-primary-cyan: #00ffff;
--color-primary-magenta: #ff00ff;
--spacing-lg: 16px;
--radius-lg: 12px;
```

**📚 Full customization guide**: [THEME_CUSTOMIZATION.md](THEME_CUSTOMIZATION.md)

### 🌈 Example Themes

- **Ocean**: Blue/teal cyberpunk aesthetic
- **Fire**: Red/orange neon styling  
- **Purple**: Violet/magenta color scheme

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Development Process

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with proper testing
4. **Commit your changes**: `git commit -am 'Add some feature'`
5. **Push to the branch**: `git push origin feature/your-feature-name`
6. **Submit a pull request** with a clear description

### Areas for Contribution

- 🐛 **Bug Fixes** - Help improve stability and performance
- ✨ **New Features** - Extend functionality and user experience  
- 🎨 **UI/UX Improvements** - Enhance the cyberpunk aesthetic
- 📚 **Documentation** - Improve guides and API documentation
- 🧪 **Testing** - Add comprehensive test coverage
- 🔧 **Performance** - Optimize loading and real-time features

### Code Standards

- Follow ES6+ JavaScript standards
- Maintain the cyberpunk theme consistency
- Write clear, documented code
- Test on multiple devices and browsers
- Ensure accessibility compliance

## 📞 Issues and Support

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/HarleyVader/js-bambisleep-church/issues)
- **💡 Feature Requests**: [GitHub Issues](https://github.com/HarleyVader/js-bambisleep-church/issues)
- **💬 Questions**: [GitHub Discussions](https://github.com/HarleyVader/js-bambisleep-church/discussions)
- **📖 Documentation**: Check our comprehensive guides above

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### License Summary

- ✅ **Commercial Use** - Use in commercial projects
- ✅ **Modification** - Modify and distribute changes
- ✅ **Distribution** - Share with others
- ✅ **Private Use** - Use privately
- ❌ **Liability** - No warranty provided
- ❌ **Warranty** - Use at your own risk

---

**🌟 Star this repo if you found it helpful!** | **🍴 Fork to contribute** | **📢 Share with the community**
