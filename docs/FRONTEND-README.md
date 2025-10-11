# BambiSleep Church - Frontend Architecture

## Overview

BambiSleep Church has been completely rebuilt with a modern React frontend using Vite, while maintaining the existing Express.js backend. This creates a dual architecture system that supports both modern React SPA and traditional EJS templates.

## Architecture

### Frontend (React + Vite)

- **Framework**: React 18.3.1 with modern hooks and ES7+ syntax
- **Build Tool**: Vite 5.4.10 with optimized development and production builds
- **Routing**: React Router 6.28.0 for client-side navigation
- **Styling**: CSS Modules for scoped component styling
- **API Layer**: Axios-based service layer with comprehensive backend integration

### Backend (Express.js)

- **Dual Mode**: Serves React build in production, EJS templates in development
- **API Endpoints**: RESTful API for frontend consumption
- **Real-time**: Socket.IO integration for live features
- **MCP Integration**: Model Context Protocol server support

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   cd js-bambisleep-church
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development Workflow

#### Full Development (Frontend + Backend)

```bash
npm run dev:full
```

- Backend runs on `http://localhost:7070` (Express + Socket.IO)
- Frontend runs on `http://localhost:3000` (Vite dev server)
- API calls are proxied from frontend to backend

#### Frontend Only

```bash
cd frontend
npm run dev
```

- Runs Vite dev server on `http://localhost:3000`
- Requires backend to be running separately

#### Backend Only

```bash
npm run dev
```

- Runs Express server on `http://localhost:7070`
- Serves EJS templates in development mode

### Production Deployment

1. **Build frontend**

   ```bash
   npm run build
   ```

2. **Start production server**

   ```bash
   npm start
   ```

   - Serves React build from `dist/` directory
   - Express handles API routes and fallback to React

## Project Structure

```
js-bambisleep-church/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── ErrorBoundary/  # Error handling
│   │   │   ├── LoadingSpinner/ # Loading states
│   │   │   └── index.js        # Component exports
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── index.js        # useApi, useDebounce, etc.
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── KnowledgeBase.jsx # Knowledge search
│   │   │   ├── Agents.jsx      # MCP chat interface
│   │   │   ├── Mission.jsx     # About page
│   │   │   └── Roadmap.jsx     # Development roadmap
│   │   ├── services/           # API service layer
│   │   │   └── api.js          # Axios-based API client
│   │   ├── styles/             # CSS modules
│   │   │   ├── globals.css     # Global styles & variables
│   │   │   └── *.module.css    # Component-specific styles
│   │   ├── App.jsx             # Root component with routing
│   │   └── main.jsx            # React app entry point
│   ├── public/                 # Static assets
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Frontend dependencies
├── src/                        # Express backend
│   ├── server.js              # Main server file
│   ├── knowledge/             # Knowledge base data
│   ├── services/              # Backend services
│   ├── utils/                 # Utilities
│   └── workers/               # Background workers
├── views/                     # EJS templates (legacy)
├── public/                    # Static assets (legacy)
├── dist/                      # Built React app (production)
└── package.json               # Backend dependencies
```

## Key Features

### Modern React Architecture

- **Component-Based**: Modular, reusable components
- **Hooks**: Modern React patterns with custom hooks
- **Error Boundaries**: Graceful error handling
- **Loading States**: User-friendly loading indicators
- **Responsive Design**: Mobile-first CSS modules

### API Integration

- **Service Layer**: Centralized API management
- **Error Handling**: Consistent error patterns
- **Loading States**: Built-in loading management
- **WebSocket Support**: Real-time features

### Development Experience

- **Hot Reload**: Instant development feedback
- **CSS Modules**: Scoped styling without conflicts
- **Path Aliases**: Clean import statements
- **Proxy Setup**: Seamless backend integration

## API Services

The frontend includes comprehensive API services:

### mcpService

- `getStatus()` - MCP server status
- `getTools()` - Available MCP tools
- `getCapabilities()` - Server capabilities

### knowledgeService

- `getAll()` - Fetch knowledge base
- `search(query)` - Search knowledge entries
- `getByCategory(category)` - Filter by category

### agenticService

- `sendMessage(message)` - Send chat message
- `getHistory()` - Chat history
- `clearHistory()` - Clear chat

### healthService

- `check()` - Health check endpoint
- `getStats()` - System statistics

### socketService

- `connect()` - WebSocket connection
- `disconnect()` - Close connection
- `on(event, callback)` - Event listeners

## CSS Architecture

### Global Styles

- CSS custom properties for theming
- Cyberpunk color scheme
- Typography definitions
- Responsive breakpoints

### Component Styles

- CSS Modules for scoped styling
- BEM-inspired naming conventions
- Consistent spacing system
- Responsive design patterns

### Theming

```css
:root {
  --primary: #8b5cf6;
  --secondary: #06b6d4;
  --accent: #f59e0b;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
}
```

## Routing

React Router handles all client-side routing:

- `/` - Home page
- `/knowledge` - Knowledge base search
- `/agents` - MCP chat interface
- `/mission` - About/mission page
- `/roadmap` - Development roadmap

## Error Handling

### Error Boundaries

- Catches React component errors
- Provides fallback UI
- Development error details
- Production-safe error messages

### API Error Handling

- Consistent error response format
- User-friendly error messages
- Retry mechanisms
- Loading state management

## Performance

### Build Optimization

- Code splitting by route
- Vendor chunk separation
- CSS extraction and minification
- Asset optimization

### Development

- Hot module replacement
- Instant feedback
- Source maps
- Development warnings

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style

- ESLint configuration included
- Prettier for code formatting
- Consistent naming conventions
- Component and hook patterns

## Troubleshooting

### Common Issues

**Port already in use**

```bash
# Find process using port
netstat -ano | findstr :7070
# Kill process (Windows)
taskkill /PID <PID> /F
```

**Frontend not connecting to backend**

- Check proxy configuration in `vite.config.js`
- Ensure backend is running on port 7070
- Verify API endpoint URLs

**Build failures**

- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Check Node.js version compatibility

**CSS not loading**

- Verify CSS module imports
- Check Vite configuration
- Clear browser cache

## Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables

```env
NODE_ENV=production
PORT=7070
MONGODB_URI=mongodb://localhost:27017/bambisleep
LMSTUDIO_URL=http://localhost:1234/v1
```

## License

MIT License - see LICENSE file for details.

---

**BambiSleep Church** - A digital sanctuary for the BambiSleep community, rebuilt with modern React architecture while preserving the powerful Express.js backend and MCP integration.
