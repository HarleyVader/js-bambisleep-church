# BambiSleep™ Cathedral Renderer - Unity Project

**Version**: 2.0.0  
**Unity Version**: 6.2 LTS (6000.2.11f1)  
**Architecture**: Modern component-based system with separated concerns

---

## 🌸 Project Overview

Procedural gothic cathedral generator with **neon cyber goth aesthetic**, featuring:

- **VFX Graph** GPU-accelerated particle systems (pink sparkles, nuclear glow, butterfly flight)
- **Post-Processing Stack v2** (bloom 3.0, chromatic aberration 0.3, vignette 0.4)
- **Cinemachine** virtual camera system (nave, altar, roof, flyby views)
- **IPC Protocol v1.0.0** bidirectional JSON communication with Node.js

---

## 📦 Dependencies

### Core Packages

```json
"com.unity.render-pipelines.universal": "16.0.6"    // URP with HDR
"com.unity.visualeffectgraph": "16.0.6"            // GPU particle systems
"com.unity.shadergraph": "16.0.6"                  // Visual shader authoring
"com.unity.postprocessing": "3.4.0"                // Post-processing effects
"com.unity.cinemachine": "3.1.2"                   // Virtual cameras
"com.unity.animation.rigging": "1.3.1"             // Procedural animation
"com.unity.addressables": "2.3.1"                  // Asset management
"com.unity.timeline": "1.8.7"                      // Cinematic sequences
```

### UI & Text

```json
"com.unity.textmeshpro": "3.0.9"                   // Text rendering
"com.unity.ugui": "2.0.0"                          // Legacy UI system
```

---

## 🏗️ Architecture

### Component Separation (V2)

**Modern Architecture** (CathedralRendererV2.cs):

```
CathedralRendererV2 (692 lines)
├── VFXController (164 lines)          // GPU particle systems
├── PostProcessingController (228)     // Bloom, chromatic, vignette
├── CinemachineController (239)        // Virtual cameras
└── IPCBridge (391)                    // Node.js communication
```

**Legacy Architecture** (CathedralRenderer.cs):

- ⚠️ 1071 lines with mixed concerns (rendering + IPC)
- ❌ Legacy ParticleSystem instead of VFX Graph
- ❌ Embedded IPC protocol code
- ✅ **Kept for reference only**

---

## 🎨 Components Reference

### 1️⃣ CathedralRendererV2.cs (Main Controller)

**Responsibilities**:

- Procedural cathedral generation (nave, transept, apse, vaulting, arches, rosetta, buttresses, spires)
- Neon lighting system with animated flickering
- IPC callback registration for Node.js commands
- Visual effects orchestration

**Key Methods**:

```csharp
GenerateCathedral()               // Create procedural architecture
ApplyVisualEffects()              // Apply VFX, lighting, post-processing
OnIPCInitialize(string dataJson)  // Handle Node.js initialize command
OnIPCUpdate(string dataJson)      // Handle Node.js update command
OnIPCRender(string dataJson)      // Handle Node.js render command
OnIPCCamera(string dataJson)      // Handle Node.js camera command
OnIPCPostProcessing(string data)  // Handle Node.js post-processing command
```

**IPC Callbacks** (registered in `RegisterIPCCallbacks()`):

```csharp
ipcBridge.OnInitializeReceived += OnIPCInitialize;
ipcBridge.OnUpdateReceived += OnIPCUpdate;
ipcBridge.OnRenderReceived += OnIPCRender;
ipcBridge.OnCameraReceived += OnIPCCamera;
ipcBridge.OnPostProcessingReceived += OnIPCPostProcessing;
```

---

### 2️⃣ VFXController.cs (Particle Systems)

**Responsibilities**:

- GPU-accelerated VFX Graph particle systems
- Pink sparkle effects with dynamic intensity
- Nuclear glow radiation effects
- Butterfly flight (secret cow power Easter egg)

**Key Methods**:

```csharp
UpdatePinkIntensity(float intensity)      // Dynamic pink sparkle control
UpdateNuclearIntensity(float intensity)   // Dynamic nuclear glow control
TriggerCowPowerExplosion()                // Burst effect for cow powers
SetVFXActive(bool active)                 // Enable/disable all VFX
ResetVFX()                                // Reset to default state
```

**VFX Graph Requirements** (must be created in Unity Editor):

- `pinkSparkleEffect` - Assign VisualEffect component
- `nuclearGlowEffect` - Assign VisualEffect component
- `butterflyEffect` - Assign VisualEffect component (optional 🐄)

---

### 3️⃣ PostProcessingController.cs (Visual Effects)

**Responsibilities**:

- URP post-processing volume management
- Bloom intensity control (0-10)
- Chromatic aberration (0-1)
- Vignette effect (0-1)

**Key Methods**:

```csharp
SetBloomIntensity(float intensity)           // Update bloom (0-10)
SetChromaticIntensity(float intensity)       // Update chromatic aberration (0-1)
SetVignetteIntensity(float intensity)        // Update vignette (0-1)
UpdatePostProcessing(float b, float c, float v)  // Update all at once
ApplyPinkCyberGothPreset()                   // Pink preset (bloom 5.0)
ApplyNuclearGlowPreset()                     // Nuclear preset (bloom 8.0)
```

**Default Settings**:

- Bloom: 3.0 intensity, 0.9 threshold, 0.7 scatter
- Chromatic Aberration: 0.3 intensity
- Vignette: 0.4 intensity, 0.4 smoothness, black color

---

### 4️⃣ CinemachineController.cs (Camera System)

**Responsibilities**:

- Virtual camera management (4 predefined views)
- Smooth camera transitions
- FOV and damping control
- Camera shake effects

**Key Methods**:

```csharp
SwitchToNaveView()                    // Front entrance view
SwitchToAltarView()                   // Altar/apse view
SwitchToRoofView()                    // Overhead view
StartFlyby()                          // Cinematic flyby camera
SetFieldOfView(float fov)             // Update FOV (10-120)
SetCameraTarget(Transform target)     // Follow/look-at target
SetCameraShake(bool enabled, float i) // Enable shake effect
```

**Cinemachine Setup** (required in Unity Editor):

1. Create 4 CinemachineCamera GameObjects:
   - `NaveViewCamera` (position: 0, 25, -50, look at: 0, 0, 0)
   - `AltarViewCamera` (position: 0, 15, 40, look at: 0, 10, 30)
   - `RoofViewCamera` (position: 0, 80, 0, look at: 0, 0, 0)
   - `FlybyCamera` (add CinemachineSplineDolly for path movement)
2. Assign to `CinemachineController` component

---

### 5️⃣ IPCBridge.cs (Node.js Communication)

**Responsibilities**:

- Bidirectional JSON protocol via stdin/stdout
- Command routing to registered callbacks
- Heartbeat loop (5-second status updates)
- Error handling with detailed stack traces

**Message Types** (Node.js → Unity):

```json
{"type": "initialize", "data": {...}}        // Initialize scene
{"type": "update", "data": {...}}            // Update parameters
{"type": "render", "data": {...}}            // Capture screenshot
{"type": "camera", "data": {...}}            // Control camera
{"type": "postprocessing", "data": {...}}    // Update post-processing
{"type": "setPaused", "data": {...}}         // Pause/unpause
{"type": "shutdown", "data": {}}             // Graceful shutdown
```

**Response Types** (Unity → Node.js):

```json
{"type": "scene-loaded", "data": {...}}      // Scene ready
{"type": "update-ack", "data": {...}}        // Update acknowledged
{"type": "render-complete", "data": {...}}   // Screenshot saved
{"type": "camera-changed", "data": {...}}    // Camera switched
{"type": "error", "data": {...}}             // Error occurred
{"type": "heartbeat", "data": {...}}         // Status update (every 5s)
```

**IPC Events** (register callbacks via C# events):

```csharp
public event Action<string> OnInitializeReceived;
public event Action<string> OnUpdateReceived;
public event Action<string> OnRenderReceived;
public event Action<string> OnCameraReceived;
public event Action<string> OnPostProcessingReceived;
```

---

## 🚀 Usage

### Running from Node.js

```bash
# Start Unity in batch mode with IPC
node src/unity/unity-bridge.js

# Send commands from Node.js
unityBridge.sendMessage({
  type: 'initialize',
  data: { sceneName: 'Cathedral', pinkIntensity: 0.95, eldritchLevel: 777 }
});

unityBridge.sendMessage({
  type: 'camera',
  data: { view: 'altar', fieldOfView: 60 }
});

unityBridge.sendMessage({
  type: 'render',
  data: { outputPath: './output/cathedral.png', width: 3840, height: 2160 }
});
```

### Running in Unity Editor

1. **Create Scene** (`MainScene.unity`):
   - Add `CathedralRendererV2` component to empty GameObject
   - Add `VFXController` component (assign VFX Graph assets)
   - Add `PostProcessingController` component (auto-creates volume)
   - Add `CinemachineController` component (assign virtual cameras)
   - Add `IPCBridge` component (only active in batch mode)

2. **Configure Components**:
   - `CathedralRendererV2`:
     - Set `cathedralWidth` = 30
     - Set `cathedralLength` = 60
     - Set `cathedralHeight` = 40
     - Set `archCount` = 5
     - Assign controller references

3. **Press Play**:
   - Cathedral generates automatically on Start()
   - VFX effects initialize
   - Post-processing applies
   - Cinemachine camera activates

---

## 🎨 Visual Effects Configuration

### VFX Graph Setup

**Pink Sparkles** (PinkSparkle.vfxgraph):

```
Properties:
  - SpawnRate (float, default: 100)
  - TintColor (Color, default: #FF0080)
  - Lifetime (float, default: 2.0)
  - Size (float, default: 0.5)
Events:
  - OnCowPowerActivated (burst 1000 particles)
```

**Nuclear Glow** (NuclearGlow.vfxgraph):

```
Properties:
  - SpawnRate (float, default: 50)
  - TintColor (Color, default: #00FF80)
  - Lifetime (float, default: 3.0)
  - Intensity (float, default: 5.0)
```

### Post-Processing Profile

**Volume Settings** (Global Volume):

```
Bloom:
  - Mode: High Quality
  - Intensity: 3.0 (pink) / 5.0 (cyber goth) / 8.0 (nuclear)
  - Threshold: 0.9
  - Scatter: 0.7

Chromatic Aberration:
  - Intensity: 0.3 (default) / 0.5 (cyber goth) / 0.7 (nuclear)

Vignette:
  - Intensity: 0.4 (default) / 0.6 (cyber goth) / 0.3 (nuclear)
  - Smoothness: 0.4
  - Color: Black (#000000)
```

---

## 📊 Performance

### Procedural Generation

- **Generation Time**: ~0.5s for default cathedral (156 objects)
- **Batch Mode**: Add `-nographics` flag to Unity for headless server
- **Memory Usage**: ~200MB for cathedral + VFX + post-processing

### VFX Graph Benefits

- **10x faster** than legacy ParticleSystem
- **GPU-accelerated** rendering (1,000,000+ particles possible)
- **Batch-friendly** for headless rendering

---

## 🐄 Secret Cow Powers

**Butterfly Flight Effect** (hidden Easter egg):

- Reference to Diablo II secret cow level
- Triggered by eldritch level = 666 or 1000
- Spawns 20 butterflies with procedural flight paths
- Activate via: `vfxController.TriggerCowPowerExplosion();`

---

## 🔧 Troubleshooting

### Issue: VFX Graph not rendering

**Solution**: Ensure URP renderer has VFX Graph enabled:

1. Project Settings → Graphics → URP Renderer
2. Check "VFX Graph" checkbox
3. Restart Unity Editor

### Issue: Post-processing not visible

**Solution**: Ensure camera has URP renderer:

1. Select Main Camera
2. Check Renderer is set to "UniversalRenderPipelineAsset"
3. Ensure HDR is enabled

### Issue: Cinemachine cameras not switching

**Solution**: Check priority values:

- Active camera should have Priority = 100
- Inactive cameras should have Priority = 0
- Brain blends between highest priority cameras

### Issue: IPC not working in batch mode

**Solution**: Ensure Unity launched with correct flags:

```bash
Unity -batchmode -projectPath ./unity-projects/cathedral-renderer \
      -executeMethod IPCBridge.StartIPC -logFile ./logs/unity.log
```

---

## 📚 References

- **IPC Protocol Spec**: `docs/architecture/UNITY_IPC_PROTOCOL.md` (432 lines)
- **Development Guide**: `docs/development/UNITY_SETUP_GUIDE.md` (858 lines)
- **Main README**: `../../README.md` (project overview)
- **Copilot Instructions**: `.github/copilot-instructions.md` (2,324 lines with complete Scenario 9)

---

## 🌸 Trademark

**BambiSleep™** is a trademark of BambiSleepChat organization.  
**License**: MIT  
**Copyright**: 2025 BambiSleepChat
