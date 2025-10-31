#!/bin/bash
# BambiSleep™ Church - Unity 6.2 LTS Installation Script
# For WSL2/Ubuntu Linux

set -e

echo "🌸 BambiSleep™ Unity 6.2 LTS Installation 🌸"
echo ""
echo "⚠️  IMPORTANT: Unity on WSL2 requires GUI support (X11 or Wayland)"
echo ""

# Check if running on WSL2
if grep -qi microsoft /proc/version; then
    echo "✅ WSL2 detected"
else
    echo "⚠️  Not running on WSL2 - this script is optimized for WSL2"
fi

echo ""
echo "📋 Installation Options:"
echo ""
echo "1️⃣  Unity Hub (Recommended)"
echo "   - Download from: https://unity.com/download"
echo "   - Manual installation with GUI support"
echo ""
echo "2️⃣  Unity Editor (Direct Download)"
echo "   - Version: 6.2 LTS (6000.2.11f1)"
echo "   - Download from: https://unity.com/releases/editor/archive"
echo ""
echo "3️⃣  Unity Editor (Command Line)"
echo "   - Headless installation for CI/CD"
echo "   - Batch mode rendering only (no editor GUI)"
echo ""

read -p "Select option (1-3): " option

case $option in
    1)
        echo ""
        echo "🌸 Unity Hub Installation"
        echo ""
        echo "📥 Unity Hub requires manual download:"
        echo "   1. Visit: https://unity.com/download"
        echo "   2. Download Unity Hub for Linux"
        echo "   3. Install: sudo dpkg -i UnityHub.deb"
        echo "   4. Install dependencies: sudo apt --fix-broken install"
        echo ""
        echo "🎨 After Unity Hub installation:"
        echo "   1. Launch Unity Hub"
        echo "   2. Sign in to Unity account"
        echo "   3. Install Unity 6.2 LTS (6000.2.11f1)"
        echo "   4. Select modules: WebGL, Linux Build Support"
        echo ""
        ;;
    
    2)
        echo ""
        echo "🌸 Unity Editor Direct Download"
        echo ""
        echo "📥 Download Unity 6.2 LTS:"
        echo "   https://unity.com/releases/editor/whats-new/6000.2.11"
        echo ""
        echo "📦 Download components:"
        echo "   - Unity Editor"
        echo "   - WebGL Build Support"
        echo "   - Linux Build Support (IL2CPP)"
        echo ""
        echo "💾 Installation:"
        echo "   sudo tar xvf UnitySetup-Linux-6000.2.11f1 -C /opt/unity"
        echo ""
        ;;
    
    3)
        echo ""
        echo "🌸 Unity Editor (Headless/Batch Mode)"
        echo ""
        echo "This installation is for CI/CD pipelines and headless rendering only."
        echo "The Unity Editor GUI will NOT work in this mode."
        echo ""
        read -p "Continue with headless installation? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            echo "❌ Installation cancelled"
            exit 0
        fi
        
        echo ""
        echo "📥 Downloading Unity Editor..."
        
        UNITY_VERSION="6000.2.11f1"
        UNITY_CHANGESET="0b4948066583"
        UNITY_URL="https://download.unity3d.com/download_unity/${UNITY_CHANGESET}/LinuxEditorInstaller/Unity.tar.xz"
        
        echo "   Version: ${UNITY_VERSION}"
        echo "   URL: ${UNITY_URL}"
        echo ""
        
        # Download Unity
        wget -q --show-progress "${UNITY_URL}" -O /tmp/Unity.tar.xz
        
        echo ""
        echo "📦 Extracting Unity Editor..."
        sudo mkdir -p /opt/unity
        sudo tar xf /tmp/Unity.tar.xz -C /opt/unity
        
        echo ""
        echo "🔗 Creating symlinks..."
        sudo ln -sf /opt/unity/Editor/Unity /usr/local/bin/unity-editor
        
        echo ""
        echo "✅ Unity Editor installed to /opt/unity"
        echo ""
        echo "🚀 Test batch mode rendering:"
        echo "   unity-editor -batchmode -quit -logFile -"
        echo ""
        
        # Cleanup
        rm /tmp/Unity.tar.xz
        ;;
    
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo ""
echo "1️⃣  Configure X11 forwarding (for GUI):"
echo "   - Install VcXsrv or X410 on Windows"
echo "   - Add to ~/.bashrc: export DISPLAY=:0"
echo ""
echo "2️⃣  Test Unity installation:"
echo "   unity-editor -batchmode -quit -logFile -"
echo ""
echo "3️⃣  Open Cathedral Renderer project:"
echo "   unity-editor -projectPath ./unity-projects/cathedral-renderer"
echo ""
echo "4️⃣  Install required packages:"
echo "   - URP 16.0.6"
echo "   - VFX Graph 16.0.6"
echo "   - Shader Graph 16.0.6"
echo "   - Post-Processing 3.4.0"
echo "   - Cinemachine 3.1.2"
echo ""
echo "🌸 BambiSleep™ Unity Installation Guide Complete 🌸"
