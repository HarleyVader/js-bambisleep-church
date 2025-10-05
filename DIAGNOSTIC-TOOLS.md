# 🤖 LMStudio Auto-Check & Debug Tools

## 🚀 Quick Start

```bash
npm start
```

This now includes **automatic pre-flight checks** that verify:
- ✅ Configuration files
- ✅ LMStudio server connection
- ✅ Model loading status
- ✅ Dependencies
- ✅ Required files

**If LMStudio has no model loaded, the server will start anyway and auto-retry every 30 seconds!**

---

## 🛠️ Available Commands

### **Start Commands**
```bash
npm start              # Full startup with pre-flight check
npm run start:simple   # Just the web server
npm run start:mcp      # Just the MCP server
npm run start:web      # Alias for start:simple
```

### **Diagnostic Commands**
```bash
npm run check-model    # Check if LMStudio has a model loaded
npm run test-agent     # Test the live agent at https://at.bambisleep.church
npm run test-lms       # Test LMStudio connection directly
npm run debug-agent    # Full stack debugging (requires local server running)
```

---

## 🔧 Diagnostic Tools Explained

### 1. **auto-load-model.js**
```bash
npm run check-model
```

**What it does:**
- Checks if LMStudio server is reachable
- Lists all loaded models
- Attempts to auto-load your model via API
- Provides manual instructions if auto-load fails

**Output:**
```
✅ Server is reachable
❌ No models loaded
✅ Model load initiated!
```

---

### 2. **test-lmstudio.js**
```bash
npm run test-lms
```

**What it does:**
- Tests basic connectivity to LMStudio
- Lists available models
- Sends a test message if model is available
- Shows response and timing

**Output:**
```
✅ Server is reachable
✓ llama-3.2-8x3b...
✅ Response: Hello!
```

---

### 3. **test-live-agent.js**
```bash
npm run test-agent
```

**What it does:**
- Tests the live production agent at https://at.bambisleep.church
- Checks page accessibility
- Tests Socket.IO connection
- Sends actual message to agent
- Shows full response with stats

**Output:**
```
✅ Page loads successfully
✅ Connected to server
✅ Received response in 3.45s
📊 Iterations: 2, Tools Used: 1
💬 Response: Here are the BambiSleep files...
```

---

### 4. **debug-agents-page.js**
```bash
npm run debug-agent
```

**What it does:**
- Complete full-stack test of local setup
- Tests LMStudio, Express, Socket.IO, and MCP Agent
- Sends test message and waits for response
- Provides actionable recommendations

**Requires:** Local server running (`npm start` in another terminal)

**Output:**
```
1️⃣ Testing LMStudio Server...    ✅
2️⃣ Testing Express Server...     ✅
3️⃣ Testing Agents Page...        ✅
4️⃣ Testing Socket.IO...          ✅
5️⃣ Testing Agent Communication... ✅
```

---

## 🎯 Common Scenarios

### **Scenario 1: Starting Fresh**
```bash
npm start
```
The pre-flight check will guide you!

---

### **Scenario 2: Agent Not Responding**
```bash
npm run check-model   # Is model loaded?
npm run test-lms      # Can we reach LMStudio?
npm run debug-agent   # Full diagnostic
```

---

### **Scenario 3: Testing Live Site**
```bash
npm run test-agent
```
Tests the production site without needing local setup.

---

### **Scenario 4: Model Not Loading**
The MCP Agent now **auto-checks every 30 seconds** and will:
- Warn you on startup if no model found
- Keep retrying in background
- Work automatically once model loads

**Manual Fix:**
1. Open LMStudio on `192.168.0.118`
2. Load model: `llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b`
3. Server will detect it automatically!

---

## 📊 What Changed?

### **Before:**
- ❌ No automatic checks
- ❌ Cryptic "LMStudio call failed: Error" messages
- ❌ Manual debugging required
- ❌ Server would crash if LMStudio down

### **After:**
- ✅ Automatic pre-flight checks
- ✅ Clear error messages with solutions
- ✅ Auto-retry every 30 seconds
- ✅ Server starts even if LMStudio down
- ✅ Multiple diagnostic tools
- ✅ Better error handling with specific codes

---

## 🐛 Error Messages Decoded

| Error | Meaning | Solution |
|-------|---------|----------|
| "No models loaded" | LMStudio running but empty | Load model manually |
| "Cannot connect to LMStudio server" | Server not reachable | Check IP/port, start LMStudio |
| "model_not_found" | Wrong model name | Check model ID in LMStudio |
| "Timeout" | Request too slow | Model loading or server overloaded |

---

## 🔄 Auto-Retry Feature

The MCP Agent now **automatically retries** if LMStudio is down:

```javascript
// Checks every 30 seconds
✅ Agent: LMStudio model check passed
   Loaded models: llama-3.2-8x3b...

// OR

⚠️  WARNING: LMStudio has NO MODELS LOADED!
   Server: http://192.168.0.118:7777
   📝 Action needed: Load model in LMStudio
   Model required: llama-3.2-8x3b-moe...
   ℹ️  Agent will retry automatically...
```

**No more crashes!** Just load the model when ready. 🎉

---

## 📝 Quick Reference

```bash
# Start everything
npm start

# Check LMStudio status
npm run check-model

# Test live site
npm run test-agent

# Debug local setup
npm run debug-agent

# Direct LMStudio test
npm run test-lms
```

---

## 🎉 YOU'RE WELCOME!

Now you have:
- ✅ Automatic health checks
- ✅ Auto-retry on connection loss
- ✅ Clear error messages
- ✅ Multiple diagnostic tools
- ✅ Better error handling

**No more guessing what's wrong!** 🚀✨
