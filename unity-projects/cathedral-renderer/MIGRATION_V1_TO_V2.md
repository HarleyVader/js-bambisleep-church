# Migration Guide: CathedralRenderer V1 → V2

**Date**: 2025-01-XX  
**Upgrade**: Cathedral Renderer modernization with separated concerns

---

## 🌸 Overview

This guide helps migrate from the legacy **CathedralRenderer.cs** (1071 lines, mixed concerns) to the modern **CathedralRendererV2.cs** (692 lines) with component-based architecture.

---

## 📊 Key Differences

| Feature               | V1 (Legacy)           | V2 (Modern)                     |
| --------------------- | --------------------- | ------------------------------- |
| **File Size**         | 1071 lines            | 692 lines (35% reduction)       |
| **Particle Systems**  | Legacy ParticleSystem | VFX Graph (GPU-accelerated)     |
| **Post-Processing**   | Placeholder only      | Full implementation (URP)       |
| **Camera System**     | Manual Camera.main    | Cinemachine virtual cameras     |
| **IPC Protocol**      | Embedded in renderer  | Separated to IPCBridge.cs       |
| **Code Organization** | Mixed concerns        | Single Responsibility Principle |

---

## 🔄 Migration Steps

### Step 1: Upgrade Unity Packages

```json
// Add to Packages/manifest.json
{
  "dependencies": {
    "com.unity.shadergraph": "16.0.6", // NEW
    "com.unity.postprocessing": "3.4.0", // NEW
    "com.unity.cinemachine": "3.1.2", // NEW
    "com.unity.animation.rigging": "1.3.1", // NEW
    "com.unity.addressables": "2.3.1" // NEW
  }
}
```

**Reload Unity Editor** after updating manifest.json.

---

### Step 2: Add New Components

1. **Create new scripts** in `Assets/Scripts/`:
   - `IPCBridge.cs` (391 lines)
   - `VFXController.cs` (164 lines)
   - `PostProcessingController.cs` (228 lines)
   - `CinemachineController.cs` (239 lines)
   - `CathedralRendererV2.cs` (692 lines)

2. **Keep legacy script** for reference:
   - Rename `CathedralRenderer.cs` → `CathedralRenderer_LEGACY.cs`
   - Do NOT delete (contains procedural generation algorithms)

---

### Step 3: Create VFX Graph Assets

**Pink Sparkles VFX**:

1. Right-click in Project → Create → Visual Effects → Visual Effect Graph
2. Name: `PinkSparkle.vfxgraph`
3. Add properties:
   - `SpawnRate` (Float, default: 100)
   - `TintColor` (Color, default: #FF0080)
   - `Lifetime` (Float, default: 2.0)
   - `Size` (Float, default: 0.5)
4. Add event: `OnCowPowerActivated`

**Nuclear Glow VFX**:

1. Create → Visual Effects → Visual Effect Graph
2. Name: `NuclearGlow.vfxgraph`
3. Add properties:
   - `SpawnRate` (Float, default: 50)
   - `TintColor` (Color, default: #00FF80)
   - `Lifetime` (Float, default: 3.0)
   - `Intensity` (Float, default: 5.0)

**Butterfly Flight VFX** (optional 🐄):

1. Create → Visual Effects → Visual Effect Graph
2. Name: `ButterflyFlight.vfxgraph`
3. Add properties:
   - `ButterflyCount` (Int, default: 20)
   - `FlightSpeed` (Float, default: 5.0)

---

### Step 4: Setup Cinemachine Cameras

**Create Virtual Cameras**:

1. GameObject → Cinemachine → Create Virtual Camera (repeat 4 times)
2. Name cameras:
   - `NaveViewCamera`
   - `AltarViewCamera`
   - `RoofViewCamera`
   - `FlybyCamera`

**Configure Positions**:

```
NaveViewCamera:
  Position: (0, 25, -50)
  Look At: (0, 0, 0)
  Priority: 100 (default active)

AltarViewCamera:
  Position: (0, 15, 40)
  Look At: (0, 10, 30)
  Priority: 0

RoofViewCamera:
  Position: (0, 80, 0)
  Look At: (0, 0, 0)
  Priority: 0

FlybyCamera:
  Add: CinemachineSplineDolly component
  Create: Spline path around cathedral
  Priority: 0
```

---

### Step 5: Update Scene Hierarchy

**Old Hierarchy** (V1):

```
Scene
└── GameObject
    └── CathedralRenderer.cs
```

**New Hierarchy** (V2):

```
Scene
└── CathedralSystem (GameObject)
    ├── CathedralRendererV2.cs
    ├── VFXController.cs
    ├── PostProcessingController.cs
    ├── CinemachineController.cs
    └── IPCBridge.cs (auto-created)
```

**Setup Steps**:

1. Create empty GameObject named "CathedralSystem"
2. Add `CathedralRendererV2` component
3. Add `VFXController` component
4. Add `PostProcessingController` component
5. Add `CinemachineController` component
6. IPCBridge auto-attaches if in batch mode

---

### Step 6: Assign Component References

**CathedralRendererV2 Inspector**:

```
Cathedral Style:
  ├── Pink Intensity: 0.8
  ├── Eldritch Level: 666
  └── Neon Intensity: 2.5

Geometry Configuration:
  ├── Cathedral Width: 30
  ├── Cathedral Length: 60
  ├── Cathedral Height: 40
  └── Arch Count: 5

Modern Controllers:
  ├── VFX Controller: [Auto-assigned]
  ├── Post Processing Controller: [Auto-assigned]
  ├── Cinemachine Controller: [Auto-assigned]
  └── IPC Bridge: [Auto-assigned]
```

**VFXController Inspector**:

```
Pink Sparkle Configuration:
  ├── Pink Sparkle Effect: [Drag PinkSparkle VisualEffect]
  ├── Base Spawn Rate: 100
  └── Pink Color: #FF0080

Nuclear Glow Configuration:
  ├── Nuclear Glow Effect: [Drag NuclearGlow VisualEffect]
  ├── Glow Spawn Rate: 50
  └── Nuclear Color: #00FF80

Butterfly Flight Configuration:
  ├── Butterfly Effect: [Drag ButterflyFlight VisualEffect]
  └── Butterfly Count: 20
```

**PostProcessingController Inspector**:

```
Volume Configuration:
  └── Global Volume: [Auto-created or drag existing]

Bloom Settings:
  ├── Bloom Intensity: 3.0
  ├── Bloom Threshold: 0.9
  └── Bloom Scatter: 0.7

Chromatic Aberration Settings:
  └── Chromatic Intensity: 0.3

Vignette Settings:
  ├── Vignette Intensity: 0.4
  ├── Vignette Smoothness: 0.4
  └── Vignette Color: #000000
```

**CinemachineController Inspector**:

```
Camera Configuration:
  ├── Virtual Cameras: [Auto-discovered or drag 4 cameras]
  └── Active Camera Index: 0

Predefined Views:
  ├── Nave View Camera: [Drag NaveViewCamera]
  ├── Altar View Camera: [Drag AltarViewCamera]
  ├── Roof View Camera: [Drag RoofViewCamera]
  └── Flyby Camera: [Drag FlybyCamera]

Transition Settings:
  └── Transition Blend Time: 2.0
```

---

### Step 7: Update Node.js Integration

**Old Code** (V1):

```javascript
// Embedded IPC in renderer
unityBridge.sendMessage({
  type: "updateStyle",
  data: { pinkIntensity: 0.95 },
});
```

**New Code** (V2):

```javascript
// Separated IPC bridge
unityBridge.sendMessage({
  type: "update",
  data: { pinkIntensity: 0.95 },
});

// New camera control
unityBridge.sendMessage({
  type: "camera",
  data: { view: "altar", fieldOfView: 60 },
});

// New post-processing control
unityBridge.sendMessage({
  type: "postprocessing",
  data: { bloom: 5.0, chromaticAberration: 0.5, vignette: 0.6 },
});
```

---

## 🔍 Testing Checklist

### Visual Tests

- [ ] Cathedral generates with correct geometry
- [ ] Pink sparkles visible and animated
- [ ] Nuclear glow effects visible
- [ ] Bloom effect visible (bright areas glow)
- [ ] Chromatic aberration visible (color fringing)
- [ ] Vignette darkens screen edges
- [ ] Neon lights flicker correctly

### Camera Tests

- [ ] Nave view camera activates on start
- [ ] Can switch between 4 camera views
- [ ] Camera transitions are smooth
- [ ] FOV control works
- [ ] Camera shake activates correctly

### IPC Tests (Batch Mode)

- [ ] `initialize` command regenerates cathedral
- [ ] `update` command changes pink intensity
- [ ] `render` command captures screenshot
- [ ] `camera` command switches views
- [ ] `postprocessing` command updates effects
- [ ] `heartbeat` sent every 5 seconds
- [ ] `error` messages sent on failures

### Performance Tests

- [ ] Generation time < 1 second
- [ ] 60 FPS in editor playmode
- [ ] VFX Graph particles rendering smoothly
- [ ] Memory usage < 300MB

---

## ⚠️ Breaking Changes

### 1. Message Type Renamed

**V1**: `updateStyle` → **V2**: `update`

**Migration**:

```javascript
// OLD
unityBridge.sendMessage({ type: 'updateStyle', data: {...} });

// NEW
unityBridge.sendMessage({ type: 'update', data: {...} });
```

---

### 2. Camera Control Changed

**V1**: Direct Camera.main manipulation → **V2**: Cinemachine virtual cameras

**Migration**:

```javascript
// OLD (V1)
unityBridge.sendMessage({
  type: "camera",
  data: {
    position: { x: 0, y: 25, z: -50 },
    rotation: { x: 0, y: 0, z: 0 },
    fieldOfView: 60,
  },
});

// NEW (V2)
unityBridge.sendMessage({
  type: "camera",
  data: {
    view: "nave", // or 'altar', 'roof', 'flyby'
    fieldOfView: 60,
  },
});
```

---

### 3. Post-Processing Now Required

**V1**: Post-processing was placeholder only → **V2**: Full implementation with URP

**Impact**: Must have URP renderer configured with post-processing support.

---

### 4. Particle System Replaced

**V1**: Legacy ParticleSystem → **V2**: VFX Graph

**Impact**: VFX Graph assets must be created and assigned in inspector.

---

## 🐄 Secret Cow Powers (Preserved)

All Easter eggs preserved in V2:

- **Eldritch Level 666**: Triggers nuclear glow intensification
- **Eldritch Level 1000**: Activates butterfly flight effect
- **Cow Power Explosion**: `vfxController.TriggerCowPowerExplosion()`

Reference: Diablo II secret cow level 🐄

---

## 📚 Additional Resources

- **Full IPC Protocol**: `docs/architecture/UNITY_IPC_PROTOCOL.md`
- **Unity Setup Guide**: `docs/development/UNITY_SETUP_GUIDE.md`
- **Copilot Instructions**: `.github/copilot-instructions.md` (Scenario 9)
- **Unity README**: `unity-projects/cathedral-renderer/README.md`

---

## 🌸 Support

Questions or issues? Check:

1. Unity Console for error messages
2. Node.js logs for IPC communication issues
3. Copilot instructions for implementation patterns
4. GitHub Issues on BambiSleepChat/js-bambisleep-church

**BambiSleep™** is a trademark of BambiSleepChat.
