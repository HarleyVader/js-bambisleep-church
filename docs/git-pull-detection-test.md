# Git Pull Detection Test

This script demonstrates the automatic git pull detection and update functionality.

## How it works

1. **Startup Check**: Every time `npm start` runs, it checks if the remote repository has updates
2. **Auto-Pull**: If updates are detected, it automatically pulls changes
3. **Auto-Install**: After pull, it runs `npm install` on both backend and frontend
4. **Process Restart**: Exits gracefully to allow process manager to restart with new code
5. **Continuous Monitoring**: In development mode, checks every 30 seconds for updates

## Test Commands

```bash
# Normal startup (checks for updates once)
npm start

# Production mode (checks for updates once)
NODE_ENV=production npm start
```

## What happens during update detection

```text
🔍 Checking for repository updates...
🔄 Repository updates detected! Pulling changes...
📦 Running npm install after pull...
✅ Repository updated successfully! Process will restart...
```

## Features

- ✅ **Cross-platform compatibility** (Windows/Unix)
- ✅ **Error handling** - Falls back to normal startup if git fails
- ✅ **Graceful exit** - Process exits with code 0 for restart
- ✅ **Full dependency sync** - Updates both backend and frontend packages
- ✅ **Development monitoring** - Continuous checks every 30 seconds
- ✅ **Production safety** - Single check on startup for production mode

Perfect for CI/CD workflows and automated deployment scenarios!
