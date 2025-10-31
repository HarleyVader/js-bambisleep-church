# Unity IPC Protocol Documentation

_🔮 Communication Protocol Between Node.js MCP Control Tower and Unity Cathedral Renderer 🔮_

## Overview

The **Unity IPC (Inter-Process Communication) Protocol** enables bidirectional communication between the Node.js MCP Control Tower and the Unity Cathedral Renderer. Communication occurs via JSON messages exchanged through **stdin/stdout** streams.

## Architecture

```
┌──────────────────────────────────┐
│   Node.js MCP Control Tower      │
│   (src/unity/unity-bridge.js)    │
└────────────┬─────────────────────┘
             │
             │ JSON Messages
             │ (stdin/stdout)
             │
┌────────────▼─────────────────────┐
│   Unity Cathedral Renderer        │
│   (CathedralRenderer.cs)          │
└──────────────────────────────────┘
```

## Message Format

All messages follow this JSON structure:

```json
{
  "type": "message_type",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    // Message-specific data
  }
}
```

## Message Types

### Node.js → Unity (Commands)

#### 1. Initialize Scene
```json
{
  "type": "initialize",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "sceneName": "MainScene",
    "cathedralWidth": 30,
    "cathedralLength": 60,
    "cathedralHeight": 25,
    "archCount": 8,
    "neonIntensity": 5.0
  }
}
```

**Purpose**: Initialize the Unity scene with specified cathedral parameters.

**Parameters**:
- `sceneName` (string): Unity scene to load
- `cathedralWidth` (number): Cathedral width in Unity units
- `cathedralLength` (number): Cathedral length in Unity units
- `cathedralHeight` (number): Cathedral height in Unity units
- `archCount` (number): Number of gothic arches
- `neonIntensity` (number): HDR emission intensity (0-10)

---

#### 2. Update Cathedral Parameters
```json
{
  "type": "update",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "cathedralWidth": 35,
    "cathedralLength": 70,
    "neonIntensity": 7.5,
    "bloomIntensity": 4.0
  }
}
```

**Purpose**: Dynamically update cathedral rendering parameters.

**Parameters**: Any subset of initialization parameters.

---

#### 3. Render Command
```json
{
  "type": "render",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "outputPath": "/path/to/output.png",
    "width": 1920,
    "height": 1080,
    "format": "PNG"
  }
}
```

**Purpose**: Trigger cathedral render and save to file.

**Parameters**:
- `outputPath` (string): File path for rendered image
- `width` (number): Render width in pixels
- `height` (number): Render height in pixels
- `format` (string): Image format ("PNG", "JPG")

---

#### 4. Camera Control
```json
{
  "type": "camera",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "position": { "x": 0, "y": 8, "z": -25 },
    "rotation": { "x": 15, "y": 0, "z": 0 },
    "fieldOfView": 60
  }
}
```

**Purpose**: Control camera position and orientation.

**Parameters**:
- `position` (object): Camera position (x, y, z)
- `rotation` (object): Camera rotation in Euler angles (x, y, z)
- `fieldOfView` (number): Camera FOV in degrees

---

#### 5. Post-Processing Control
```json
{
  "type": "postprocessing",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "bloom": 3.0,
    "chromaticAberration": 0.3,
    "vignette": 0.4,
    "enabled": true
  }
}
```

**Purpose**: Adjust post-processing effects.

**Parameters**:
- `bloom` (number): Bloom intensity (0-10)
- `chromaticAberration` (number): Chromatic aberration intensity (0-1)
- `vignette` (number): Vignette intensity (0-1)
- `enabled` (boolean): Toggle post-processing on/off

---

#### 6. Shutdown Command
```json
{
  "type": "shutdown",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {}
}
```

**Purpose**: Gracefully shutdown Unity process.

---

### Unity → Node.js (Events)

#### 1. Scene Loaded
```json
{
  "type": "scene-loaded",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "sceneName": "MainScene",
    "objectCount": 156,
    "renderTime": 234.5
  }
}
```

**Purpose**: Notify that scene has loaded successfully.

---

#### 2. Render Complete
```json
{
  "type": "render-complete",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "outputPath": "/path/to/output.png",
    "renderTime": 1234.5,
    "width": 1920,
    "height": 1080
  }
}
```

**Purpose**: Notify that render has completed successfully.

---

#### 3. Parameter Update Acknowledged
```json
{
  "type": "update-ack",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "parameters": ["cathedralWidth", "neonIntensity"],
    "success": true
  }
}
```

**Purpose**: Acknowledge successful parameter update.

---

#### 4. Error Event
```json
{
  "type": "error",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "errorCode": "SHADER_COMPILATION_FAILED",
    "message": "Failed to compile neon shader",
    "stack": "UnityEngine.Shader:Compile..."
  }
}
```

**Purpose**: Report errors during execution.

**Error Codes**:
- `SHADER_COMPILATION_FAILED`: Shader compilation error
- `SCENE_LOAD_FAILED`: Scene loading error
- `RENDER_FAILED`: Rendering error
- `INVALID_MESSAGE`: Malformed IPC message
- `PARAMETER_OUT_OF_RANGE`: Invalid parameter value

---

#### 5. Heartbeat
```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "fps": 60,
    "memoryUsageMB": 512,
    "activeObjects": 156
  }
}
```

**Purpose**: Periodic status update (every 5 seconds).

---

## Implementation Details

### Node.js Side (src/unity/unity-bridge.js)

```javascript
// Send message to Unity
sendMessage(type, data) {
  const message = {
    type,
    timestamp: new Date().toISOString(),
    data
  };
  this.process.stdin.write(JSON.stringify(message) + '\n');
}

// Receive message from Unity
this.process.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const message = JSON.parse(line);
      this.handleMessage(message);
    } catch (error) {
      logger.error('Invalid JSON from Unity', { line, error: error.message });
    }
  });
});
```

### Unity Side (Assets/Scripts/CathedralRenderer.cs)

```csharp
// Receive message from Node.js
void Update() {
    if (Console.KeyAvailable) {
        string line = Console.ReadLine();
        if (!string.IsNullOrEmpty(line)) {
            ProcessMessage(line);
        }
    }
}

void ProcessMessage(string json) {
    IPCMessage message = JsonUtility.FromJson<IPCMessage>(json);
    // Handle message...
}

// Send message to Node.js
void SendMessage(string type, object data) {
    var message = new {
        type = type,
        timestamp = DateTime.UtcNow.ToString("o"),
        data = data
    };
    string json = JsonUtility.ToJson(message);
    Console.WriteLine(json);
}
```

## Error Handling

### Node.js Error Handling
- **Timeout**: If Unity doesn't respond within 30 seconds, emit `unity:timeout` event
- **Process Exit**: Monitor Unity process exit codes, restart on crash if `autoRestart: true`
- **Invalid JSON**: Log error and continue processing remaining messages

### Unity Error Handling
- **Invalid Message**: Send `error` message with `INVALID_MESSAGE` code
- **Parameter Validation**: Clamp values to valid ranges, send `error` if impossible
- **Render Failure**: Send `error` message with `RENDER_FAILED` code

## Message Flow Example

### Initialize and Render Cathedral

```
Node.js → Unity: initialize (sceneName, parameters)
Unity → Node.js: scene-loaded (objectCount, renderTime)
Node.js → Unity: update (neonIntensity=7.5)
Unity → Node.js: update-ack (success=true)
Node.js → Unity: render (outputPath, width, height)
Unity → Node.js: render-complete (outputPath, renderTime)
Node.js → Unity: shutdown
Unity process exits gracefully (code 0)
```

## Environment Variables

Configure Unity IPC behavior via environment variables:

```bash
# Unity executable path
UNITY_PATH=/opt/unity/Editor/Unity

# Unity project path
UNITY_PROJECT_PATH=/mnt/f/js-bambisleep-church/unity-projects/cathedral-renderer

# Enable/disable Unity renderer
UNITY_ENABLED=true

# Auto-start rendering on initialization
UNITY_RENDER_ON_START=false

# Message timeout (milliseconds)
UNITY_MESSAGE_TIMEOUT=30000
```

## Testing IPC Protocol

### Manual Testing with Node.js

```javascript
const UnityBridge = require('./src/unity/unity-bridge');

const bridge = new UnityBridge({
  unityPath: '/opt/unity/Editor/Unity',
  projectPath: './unity-projects/cathedral-renderer',
  renderOnStart: false
});

bridge.on('unity:started', () => {
  console.log('Unity started, sending initialize command...');
  bridge.sendMessage('initialize', {
    sceneName: 'MainScene',
    cathedralWidth: 30,
    neonIntensity: 5.0
  });
});

bridge.on('unity:scene-loaded', (data) => {
  console.log('Scene loaded:', data);
  bridge.sendMessage('render', {
    outputPath: '/tmp/cathedral.png',
    width: 1920,
    height: 1080
  });
});

bridge.on('unity:render-complete', (data) => {
  console.log('Render complete:', data);
  bridge.stop();
});

bridge.start();
```

### Unity Editor Testing

1. Open Unity project: `unity-projects/cathedral-renderer`
2. Open scene: `Assets/Scenes/MainScene.unity`
3. Attach `CathedralRenderer.cs` script to GameObject
4. Enter Play mode
5. Type JSON messages in Console manually to test IPC

## Protocol Version

**Current Version**: `1.0.0`

Future versions will include backwards-compatible changes announced in `CHANGELOG.md`.

---

_🔮 Built with the Universal Machine Philosophy - "Data flows like neon light through the void" 🔮_
