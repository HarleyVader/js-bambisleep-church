# Unity 6.2 LTS Installation Guide - WSL2/Linux

**Target Version**: Unity 6.2 LTS (6000.2.11f1)  
**Platform**: WSL2 (Windows Subsystem for Linux)  
**Date**: October 31, 2025

---

## ⚠️ Important Prerequisites

### WSL2 GUI Support Required

Unity Editor requires **X11 or Wayland** display server on WSL2:

**Option 1: VcXsrv (Free)**

1. Download: https://sourceforge.net/projects/vcxsrv/
2. Install on Windows host
3. Launch XLaunch with settings:
   - Display: Multiple windows
   - Start: No client
   - Extra: Disable access control ✓

**Option 2: X410 (Paid, $10)**

1. Install from Microsoft Store
2. Launch X410
3. Automatic WSL2 integration

**Configure WSL2**:

```bash
# Add to ~/.bashrc
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
export LIBGL_ALWAYS_INDIRECT=1

# Reload
source ~/.bashrc
```

**Test X11**:

```bash
# Install x11-apps
sudo apt install x11-apps

# Test GUI
xclock
# Should show a clock window on Windows
```

---

## 🌸 Installation Method 1: Unity Hub (Recommended)

### Step 1: Download Unity Hub

**Linux Unity Hub**:

- URL: https://unity.com/download
- File: `UnityHub.AppImage` or `UnityHub.deb`

### Step 2: Install Unity Hub

**AppImage Method** (no root required):

```bash
cd ~/Downloads
chmod +x UnityHub.AppImage
./UnityHub.AppImage
```

**DEB Package Method** (requires root):

```bash
cd ~/Downloads
sudo dpkg -i UnityHub.deb

# Fix dependencies if needed
sudo apt --fix-broken install
```

### Step 3: Launch Unity Hub

```bash
unityhub
# Or if AppImage:
./UnityHub.AppImage
```

### Step 4: Sign In

1. Create Unity account (free): https://id.unity.com/
2. Sign in to Unity Hub
3. Activate Personal license (free for hobbyists/students)

### Step 5: Install Unity 6.2 LTS

**In Unity Hub**:

1. Go to "Installs" tab
2. Click "Install Editor"
3. Select "Unity 6.2 LTS (6000.2.11f1)"
4. Choose modules:
   - ✓ **Linux Build Support (IL2CPP)** (required)
   - ✓ **WebGL Build Support** (recommended)
   - ✓ **Documentation** (recommended)
   - ✓ **Language Pack** (optional)

**Installation location**: `/home/<username>/Unity/Hub/Editor/6000.2.11f1`

---

## 🚀 Installation Method 2: Direct Download (No Hub)

### Step 1: Download Unity Editor

**Unity 6.2 LTS Direct Link**:

```bash
UNITY_VERSION="6000.2.11f1"
UNITY_CHANGESET="0b4948066583"
UNITY_URL="https://download.unity3d.com/download_unity/${UNITY_CHANGESET}/LinuxEditorInstaller/Unity.tar.xz"

wget "${UNITY_URL}" -O /tmp/Unity.tar.xz
```

### Step 2: Extract Unity

```bash
# Create Unity directory
sudo mkdir -p /opt/unity

# Extract (takes 5-10 minutes)
sudo tar xf /tmp/Unity.tar.xz -C /opt/unity

# Create symlink
sudo ln -sf /opt/unity/Editor/Unity /usr/local/bin/unity-editor
```

### Step 3: Verify Installation

```bash
# Check version
unity-editor -version

# Expected output:
# 6000.2.11f1
```

---

## 🔧 Installation Method 3: Headless/Batch Mode Only

**For CI/CD pipelines and server rendering (no GUI required)**

### Automated Script

```bash
# Use the provided installation script
./scripts/install-unity.sh

# Select option 3: Unity Editor (Command Line)
```

### Manual Installation

```bash
# Download Unity Editor
wget https://download.unity3d.com/download_unity/0b4948066583/LinuxEditorInstaller/Unity.tar.xz -O /tmp/Unity.tar.xz

# Extract
sudo tar xf /tmp/Unity.tar.xz -C /opt/unity

# Create symlink
sudo ln -sf /opt/unity/Editor/Unity /usr/local/bin/unity-editor

# Test batch mode
unity-editor -batchmode -quit -logFile -
```

---

## 📦 Install Required Packages

### Method 1: Via Unity Hub (GUI)

1. Open Unity Hub
2. Click "Projects" → "Add" → Select `./unity-projects/cathedral-renderer`
3. Click project name to open in Unity Editor
4. Unity will auto-install packages from `Packages/manifest.json`

### Method 2: Via Package Manager (Unity Editor)

1. Open Unity Editor
2. Window → Package Manager
3. Install packages:
   - Universal RP 16.0.6
   - Visual Effect Graph 16.0.6
   - Shader Graph 16.0.6
   - Post Processing 3.4.0
   - Cinemachine 3.1.2
   - Animation Rigging 1.3.1
   - Addressables 2.3.1

### Method 3: Manual manifest.json

**Already configured** in `unity-projects/cathedral-renderer/Packages/manifest.json`:

```json
{
  "dependencies": {
    "com.unity.render-pipelines.universal": "16.0.6",
    "com.unity.visualeffectgraph": "16.0.6",
    "com.unity.shadergraph": "16.0.6",
    "com.unity.postprocessing": "3.4.0",
    "com.unity.cinemachine": "3.1.2",
    "com.unity.animation.rigging": "1.3.1",
    "com.unity.addressables": "2.3.1",
    "com.unity.timeline": "1.8.7",
    "com.unity.textmeshpro": "3.0.9",
    "com.unity.ugui": "2.0.0"
  }
}
```

Unity auto-downloads packages on first project load.

---

## 🎨 Open Cathedral Renderer Project

### Via Unity Hub

1. Click "Projects" → "Add"
2. Navigate to: `/mnt/f/js-bambisleep-church/unity-projects/cathedral-renderer`
3. Click "Open"
4. Unity Editor launches (may take 2-5 minutes first time)

### Via Command Line

```bash
# Open project in Unity Editor
unity-editor -projectPath /mnt/f/js-bambisleep-church/unity-projects/cathedral-renderer

# Batch mode (headless rendering)
unity-editor -batchmode -projectPath ./unity-projects/cathedral-renderer \
             -executeMethod IPCBridge.StartIPC \
             -logFile ./logs/unity.log
```

---

## 🐛 Troubleshooting

### Issue: "Display :0 cannot be opened"

**Cause**: X11 server not running on Windows host

**Solution**:

1. Launch VcXsrv or X410 on Windows
2. Check `$DISPLAY` variable:
   ```bash
   echo $DISPLAY
   # Should show: <IP>:0 or :0
   ```
3. Test with `xclock`

---

### Issue: "libc++.so.1: cannot open shared object"

**Cause**: Missing C++ libraries

**Solution**:

```bash
sudo apt update
sudo apt install -y libc++1 libc++abi1
```

---

### Issue: "Unity Editor crashes on startup"

**Cause**: Insufficient graphics driver support

**Solution**:

```bash
# Use software rendering (slower but compatible)
export LIBGL_ALWAYS_SOFTWARE=1
unity-editor -projectPath ./unity-projects/cathedral-renderer
```

---

### Issue: "Package Manager shows errors"

**Cause**: Network/registry issues

**Solution**:

```bash
# Clear package cache
rm -rf unity-projects/cathedral-renderer/Library/PackageCache

# Reopen Unity Editor (packages re-download)
```

---

### Issue: "VFX Graph assets not rendering"

**Cause**: URP renderer not configured

**Solution**:

1. Edit → Project Settings → Graphics
2. Check "Scriptable Render Pipeline Settings" is set to URP asset
3. Ensure VFX Graph support enabled in URP renderer

---

## 🚀 Next Steps After Installation

### 1. Create VFX Graph Assets

**Pink Sparkles**:

1. Right-click in Project → Create → Visual Effects → Visual Effect Graph
2. Name: `PinkSparkle.vfxgraph`
3. Add properties:
   - `SpawnRate` (Float, default: 100)
   - `TintColor` (Color, default: #FF0080)
   - `Lifetime` (Float, default: 2.0)
   - `Size` (Float, default: 0.5)

**Nuclear Glow**:

1. Create → Visual Effects → Visual Effect Graph
2. Name: `NuclearGlow.vfxgraph`
3. Add properties:
   - `SpawnRate` (Float, default: 50)
   - `TintColor` (Color, default: #00FF80)
   - `Lifetime` (Float, default: 3.0)
   - `Intensity` (Float, default: 5.0)

**Butterfly Flight** (optional 🐄):

1. Create → Visual Effects → Visual Effect Graph
2. Name: `ButterflyFlight.vfxgraph`
3. Add properties:
   - `ButterflyCount` (Int, default: 20)
   - `FlightSpeed` (Float, default: 5.0)

---

### 2. Setup Cinemachine Cameras

**Create 4 Virtual Cameras**:

1. GameObject → Cinemachine → Create Virtual Camera (repeat 4 times)
2. Name cameras:
   - `NaveViewCamera` (Position: 0, 25, -50)
   - `AltarViewCamera` (Position: 0, 15, 40)
   - `RoofViewCamera` (Position: 0, 80, 0)
   - `FlybyCamera` (add CinemachineSplineDolly)

---

### 3. Assign Component References

**CathedralRendererV2 Inspector**:

- Drag `VFXController`, `PostProcessingController`, `CinemachineController` to fields

**VFXController Inspector**:

- Drag `PinkSparkle`, `NuclearGlow`, `ButterflyFlight` VisualEffect components

**CinemachineController Inspector**:

- Drag 4 virtual cameras to predefined view fields

---

### 4. Test IPC Protocol

```bash
# Start Node.js bridge
node src/unity/unity-bridge.js

# Send test command
# (Unity should respond with heartbeat every 5 seconds)
```

---

### 5. Validate Performance

**Target Metrics**:

- **FPS**: 60 (in editor playmode)
- **Memory**: <200MB
- **Generation Time**: <1 second

**Check Performance**:

1. Window → Analysis → Profiler
2. Enable CPU, Memory, Rendering modules
3. Press Play
4. Monitor stats

---

## 📚 Additional Resources

- **Unity 6.2 LTS Docs**: https://docs.unity3d.com/6000.2/Documentation/Manual/
- **VFX Graph Tutorial**: https://learn.unity.com/tutorial/introduction-to-visual-effect-graph
- **Cinemachine Docs**: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/
- **URP Guide**: https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@16.0/manual/

---

## 🌸 BambiSleep™ Support

Questions or issues?

1. Check Unity Console for errors
2. Review `docs/development/UNITY_SETUP_GUIDE.md`
3. See `.github/copilot-instructions.md` (Scenario 9)
4. GitHub Issues: https://github.com/BambiSleepChat/js-bambisleep-church

**BambiSleep™** is a trademark of BambiSleepChat.  
**License**: MIT
