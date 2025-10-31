# 🌸 Cathedral MCP Tools - User Guide 🌸

## Overview

The **Cathedral MCP Tools** expose Unity's cathedral renderer as interactive Model Context Protocol (MCP) tools, allowing AI agents to directly manipulate the 3D cathedral environment in real-time.

## Architecture

```
AI Agent → MCP Server → Node.js Control Tower → Unity IPC → Unity Cathedral
                                                   (JSON)     (C# + Physics)
```

**Flow:**

1. AI agent calls MCP tool (e.g., `spawnObject`)
2. Node.js `CathedralMCPTools` receives call
3. Generates unique call ID and forwards to Unity via IPC
4. Unity `MCPToolHandler` processes request
5. Response sent back through IPC chain
6. AI agent receives result

## Available Tools

### 1. `setCathedralStyle`

Update visual style parameters in real-time.

**Parameters:**

- `pinkIntensity` (float, 0.0-1.0) - Pink neon intensity
- `eldritchLevel` (int, 0-1000) - Eldritch power level
- `neonIntensity` (float, 0-20) - Neon light brightness
- `lightingMode` (enum) - One of: `neon`, `nuclear`, `holy`, `cursed`

**Example:**

```javascript
{
  "pinkIntensity": 0.95,
  "eldritchLevel": 777,
  "neonIntensity": 15.0,
  "lightingMode": "nuclear"
}
```

**Response:**

```javascript
{
  "pinkIntensity": 0.95,
  "eldritchLevel": 777,
  "neonIntensity": 15.0,
  "lighting": "nuclear"
}
```

---

### 2. `spawnObject`

Spawn interactive 3D objects with physics.

**Parameters:**

- `objectType` (enum) - One of: `sphere`, `cube`, `cylinder`, `cross`, `angel`
- `x`, `y`, `z` (float) - World position coordinates
- `scale` (float, default: 1.0) - Object scale multiplier
- `color` (string, default: "#FF00FF") - Hex color code

**Example:**

```javascript
{
  "objectType": "angel",
  "x": 0,
  "y": 20,
  "z": 0,
  "scale": 3.0,
  "color": "#FFFFFF"
}
```

**Response:**

```javascript
{
  "objectId": 12345,
  "objectName": "MCPSpawned_angel_0",
  "position": { "x": 0, "y": 20, "z": 0 },
  "scale": 3.0
}
```

**Object Types:**

- **sphere** - Simple sphere with physics
- **cube** - Cube with physics
- **cylinder** - Cylinder with physics
- **cross** - Christian cross (vertical + horizontal beams)
- **angel** - Angelic figure with wings

---

### 3. `applyPhysics`

Apply physics forces to spawned objects.

**Parameters:**

- `action` (enum) - One of: `explode`, `attract`, `repel`, `float`
- `x`, `y`, `z` (float) - Center point for force
- `force` (float, default: 10) - Force magnitude
- `radius` (float, default: 10) - Effect radius

**Example:**

```javascript
{
  "action": "explode",
  "x": 0,
  "y": 10,
  "z": 0,
  "force": 100,
  "radius": 15
}
```

**Response:**

```javascript
{
  "action": "explode",
  "affectedObjects": 5
}
```

**Actions:**

- **explode** - Radial explosion force from center
- **attract** - Pull objects toward center point
- **repel** - Push objects away from center
- **float** - Apply upward force to all objects

---

### 4. `clearObjects`

Remove all spawned objects from the cathedral.

**Parameters:** None

**Example:**

```javascript
{
}
```

**Response:**

```javascript
{
  "clearedCount": 12
}
```

---

### 5. `getCathedralStatus`

Get current cathedral state and performance metrics.

**Parameters:** None

**Example:**

```javascript
{
}
```

**Response:**

```javascript
{
  "pinkIntensity": 0.8,
  "eldritchLevel": 666,
  "neonIntensity": 10.0,
  "lighting": "neon-cyber-goth",
  "spawnedObjectCount": 7,
  "fps": 60,
  "uptime": 123.45
}
```

---

### 6. `setTimeOfDay`

Change lighting to simulate different times of day.

**Parameters:**

- `hour` (float, 0-24) - Hour of day (fractional allowed)

**Example:**

```javascript
{
  "hour": 18.5  // 6:30 PM - evening
}
```

**Response:**

```javascript
{
  "hour": 18.5,
  "skyColor": "33334C",
  "intensity": 0.65
}
```

**Time Periods:**

- **6-12** - Morning (sunrise colors, increasing brightness)
- **12-18** - Afternoon (bright daylight)
- **18-22** - Evening (sunset colors, decreasing brightness)
- **22-6** - Night (dark with stars)

---

## Usage Examples

### Example 1: Create Pink Cathedral Scene

```javascript
// Set pink neon style
await setCathedralStyle({
  pinkIntensity: 1.0,
  eldritchLevel: 999,
  neonIntensity: 20.0,
  lightingMode: "neon",
});

// Spawn pink angels
for (let i = 0; i < 5; i++) {
  await spawnObject({
    objectType: "angel",
    x: i * 5 - 10,
    y: 15,
    z: 0,
    scale: 2.0,
    color: "#FF69B4",
  });
}

// Make them float
await applyPhysics({
  action: "float",
  x: 0,
  y: 0,
  z: 0,
  force: 30,
});
```

### Example 2: Explosion Effect

```javascript
// Spawn grid of cubes
for (let x = -10; x <= 10; x += 5) {
  for (let z = -10; z <= 10; z += 5) {
    await spawnObject({
      objectType: "cube",
      x,
      y: 5,
      z,
      scale: 1.0,
      color: "#00FFFF",
    });
  }
}

// Wait 2 seconds
await sleep(2000);

// BOOM!
await applyPhysics({
  action: "explode",
  x: 0,
  y: 5,
  z: 0,
  force: 200,
  radius: 20,
});
```

### Example 3: Time-lapse Visualization

```javascript
// Sunrise to sunset
for (let hour = 6; hour <= 22; hour += 0.5) {
  await setTimeOfDay({ hour });
  await sleep(500); // 0.5 second per hour
}

// Get final state
const status = await getCathedralStatus();
console.log(`FPS: ${status.fps}`);
```

---

## Integration with Node.js

### Setup

```javascript
const { CathedralMCPTools } = require("./src/mcp/cathedral-tools");
const UnityBridge = require("./src/unity/unity-bridge");

// Initialize Unity bridge
const unityBridge = new UnityBridge({
  unityPath: "/opt/unity/Editor/Unity",
  projectPath: "./unity-projects/cathedral-renderer",
});

// Start Unity
await unityBridge.startRenderer();

// Initialize MCP tools
const cathedralTools = new CathedralMCPTools(unityBridge);

// Execute tool
const result = await cathedralTools.executeTool("spawnObject", {
  objectType: "angel",
  x: 0,
  y: 20,
  z: 0,
  scale: 3.0,
});

console.log("Object spawned:", result);
```

### Cleanup

```javascript
// Clean up on shutdown
process.on("SIGTERM", async () => {
  cathedralTools.destroy();
  await unityBridge.shutdown();
});
```

---

## Error Handling

All tools may throw these errors:

**MCP_DISABLED** - MCP tools are disabled in Unity configuration
**UNKNOWN_TOOL** - Invalid tool name
**PARSE_ERROR** - Invalid parameters JSON
**UNITY_ERROR** - Unity-side error (check Unity logs)
**TIMEOUT** - Unity didn't respond within 30 seconds
**BRIDGE_UNAVAILABLE** - Unity process not running

**Example error response:**

```javascript
{
  "callId": "mcp_123_1698765432000",
  "success": false,
  "error": "SPAWN_FAILED: Invalid objectType"
}
```

---

## Performance Considerations

- **Frame Rate**: Spawning many objects reduces FPS. Recommended max: 100 objects
- **Physics**: Explosions with large forces may cause instability
- **Tool Calls**: Max 10 concurrent calls (queued automatically)
- **Memory**: Each spawned object uses ~1MB (materials + mesh + physics)

**Optimization tips:**

1. Use `clearObjects` periodically to free memory
2. Spawn objects in batches with delays
3. Monitor FPS with `getCathedralStatus`
4. Reduce `neonIntensity` if FPS drops

---

## Testing

Run comprehensive tests:

```bash
npm test -- src/tests/mcp/cathedral-tools.test.js
```

Test coverage includes:

- Tool definition schemas
- Successful tool execution
- Error handling
- Timeout behavior
- Response parsing
- Integration workflows

---

## Future Enhancements

**Planned features:**

- `playAnimation` - Trigger predefined animations
- `setCameraPosition` - Control camera view
- `captureScreenshot` - Save rendered image
- `loadScene` - Switch between cathedral scenes
- `addCustomShader` - Apply custom visual effects

See `docs/TODO.md` for roadmap.

---

## Related Documentation

- **IPC Protocol**: `public/docs/UNITY_IPC_PROTOCOL.md`
- **Unity Setup**: `public/docs/UNITY_SETUP_GUIDE.md`
- **MCP Setup**: `public/docs/MCP_SETUP_GUIDE.md`
- **Architecture**: `.github/copilot-instructions.md`

---

**🌸 Built with the Universal Machine Philosophy 🌸**
_Model Context Protocol + Unity = Infinite Possibilities_
