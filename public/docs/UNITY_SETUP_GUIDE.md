# Unity Development Setup Guide
*🌸 BambiSleep™ Church Unity Integration 🌸*

## Overview

This guide establishes Unity 6.2 development capabilities for creating the **Pink Frilly Platinum Blonde Catgirl Avatar System** with complete inventory, monetization, and universal banking integration. Built on our MCP infrastructure foundation.

### Sacred Character Requirements
- **Primary Identity**: Pink frilly platinum blonde catgirl
- **Secondary Power**: Cyber eldritch terror factorio engineer powerarmor
- **Secret Features**: COW POWERS SECRET DIABLO LEVEL ITEMS
- **Economic System**: Universal banking with gambling, auctions, inventory management

## Unity 6.2 Installation & Configuration

### 1. Unity Hub & Engine Installation

```bash
# Download Unity Hub (if not available via package manager)
cd /workspace
mkdir -p unity-setup
cd unity-setup

# Unity Hub installation for Linux
wget -qO - https://hub.unity3d.com/linux/keys/public | gpg --dearmor | sudo tee /usr/share/keyrings/Unity_Technologies_ApS.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/Unity_Technologies_ApS.gpg] https://hub.unity3d.com/linux/repos/deb stable main" | sudo tee /etc/apt/sources.list.d/unityhub.list
sudo apt update
sudo apt install unityhub

# Launch Unity Hub and install Unity 6.2 LTS
unityhub --headless install --version 6000.2.11f1 --changeset 0773b680dc03 --module linux-il2cpp
```

### 2. Project Structure & Templates

```bash
# Create project directory structure
cd /workspace
mkdir -p catgirl-avatar-project/{Assets,ProjectSettings,Packages,Logs,Temp,UserSettings}
cd catgirl-avatar-project

# Initialize Unity project structure
cat > ProjectSettings/ProjectVersion.txt << 'EOF'
m_EditorVersion: 6000.2.11f1
m_EditorVersionWithRevision: 6000.2.11f1 (0773b680dc03)
EOF

# Create essential directories
mkdir -p Assets/{Scripts,Materials,Textures,Models,Animations,Prefabs,UI,Audio,Scenes}
mkdir -p Assets/Scripts/{Character,Inventory,Economy,Networking,UI,Audio}
```

### 3. Package Dependencies Configuration

```json
// Create Packages/manifest.json
{
  "dependencies": {
    "com.unity.addressables": "2.3.1",
    "com.unity.animation.rigging": "1.3.1", 
    "com.unity.cinemachine": "2.10.1",
    "com.unity.netcode.gameobjects": "2.0.0",
    "com.unity.services.analytics": "5.1.1",
    "com.unity.services.authentication": "3.3.4",
    "com.unity.services.core": "1.15.0",
    "com.unity.services.economy": "3.4.2",
    "com.unity.services.lobby": "1.2.2",
    "com.unity.services.relay": "1.1.3",
    "com.unity.purchasing": "4.12.2",
    "com.unity.timeline": "1.8.7",
    "com.unity.ui.toolkit": "2.0.0",
    "com.unity.ugui": "2.0.0",
    "com.unity.visualeffectgraph": "16.0.6",
    "com.unity.xr.interaction.toolkit": "3.0.5"
  },
  "scopedRegistries": [
    {
      "name": "Unity",
      "url": "https://packages.unity.com",
      "scopes": ["com.unity"]
    }
  ]
}
```

## Character Avatar System Architecture

### 1. Core Character Controller

```csharp
// Assets/Scripts/Character/CatgirlController.cs
using UnityEngine;
using Unity.Netcode;
using UnityEngine.InputSystem;

[System.Serializable]
public class CatgirlStats
{
    [Header("✨ Frilly Pink Configuration")]
    public float pinkIntensity = 1.0f;
    public float frillinessLevel = 100.0f;
    
    [Header("🐱 Catgirl Properties")]  
    public float purringFrequency = 2.5f;
    public int cuteness = 9999;
    public bool hasSecretCowPowers = true;
    
    [Header("⚡ Cyber Eldritch Terror Stats")]
    public float eldritchEnergy = 666.0f;
    public int factorioProductionMultiplier = 1000;
    public bool powerArmorActive = false;
}

public class CatgirlController : NetworkBehaviour
{
    [Header("🌸 Sacred Configuration")]
    public CatgirlStats stats = new CatgirlStats();
    
    [Header("💎 Movement & Physics")]
    public float moveSpeed = 5.0f;
    public float jumpForce = 12.0f;
    public float purringLevitation = 0.5f;
    
    private CharacterController characterController;
    private Animator animator;
    private AudioSource audioSource;
    private InventorySystem inventory;
    private UniversalBankingSystem banking;
    
    // Animation Parameters (Mecanim)
    private static readonly int Speed = Animator.StringToHash("Speed");
    private static readonly int IsJumping = Animator.StringToHash("IsJumping");
    private static readonly int IsPurring = Animator.StringToHash("IsPurring");
    private static readonly int CowPowerActive = Animator.StringToHash("CowPowerActive");
    
    private void Awake()
    {
        characterController = GetComponent<CharacterController>();
        animator = GetComponent<Animator>();
        audioSource = GetComponent<AudioSource>();
        inventory = GetComponent<InventorySystem>();
        banking = GetComponent<UniversalBankingSystem>();
    }
    
    public override void OnNetworkSpawn()
    {
        // Initialize networked catgirl systems
        if (IsOwner)
        {
            InitializeCatgirlSystems();
        }
    }
    
    private void InitializeCatgirlSystems()
    {
        // 🌸 Activate pink frilly aura
        ActivatePinkFrillyAura();
        
        // 🐱 Initialize purring subsystem
        StartCoroutine(PurringCycle());
        
        // 💰 Connect to universal banking
        banking.ConnectToUniversalBank();
        
        // 🎯 Unlock secret cow powers if eligible
        if (stats.hasSecretCowPowers)
        {
            UnlockSecretCowPowers();
        }
    }
    
    private void ActivatePinkFrillyAura()
    {
        // Implementation for pink frilly visual effects
        var aura = GetComponent<ParticleSystem>();
        var main = aura.main;
        main.startColor = Color.magenta * stats.pinkIntensity;
    }
    
    private System.Collections.IEnumerator PurringCycle()
    {
        while (gameObject.activeInHierarchy)
        {
            animator.SetBool(IsPurring, true);
            audioSource.PlayOneShot(purringSound);
            yield return new WaitForSeconds(1f / stats.purringFrequency);
            animator.SetBool(IsPurring, false);
            yield return new WaitForSeconds(0.5f);
        }
    }
    
    private void UnlockSecretCowPowers()
    {
        // 🐄 Secret cow powers implementation
        Debug.Log("🐄 MOO! Secret Diablo-level cow powers ACTIVATED! 🐄");
        animator.SetBool(CowPowerActive, true);
    }
}
```

### 2. Inventory & Economy System

```csharp
// Assets/Scripts/Economy/InventorySystem.cs
using UnityEngine;
using Unity.Services.Economy;
using System.Collections.Generic;

[System.Serializable]
public class CatgirlItem
{
    public string itemId;
    public string displayName;
    public Sprite icon;
    public int rarity; // 1=Common, 5=Diablo Secret Level
    public bool isCowPowerItem = false;
    public float pinkValue = 0f;
    public string description;
}

public class InventorySystem : MonoBehaviour
{
    [Header("🎒 Inventory Configuration")]
    public int maxSlots = 100;
    public List<CatgirlItem> items = new List<CatgirlItem>();
    
    [Header("💎 Special Collections")]
    public List<CatgirlItem> cowPowerItems = new List<CatgirlItem>();
    public List<CatgirlItem> diabloSecretLevelItems = new List<CatgirlItem>();
    
    private UniversalBankingSystem banking;
    
    private void Start()
    {
        banking = GetComponent<UniversalBankingSystem>();
        LoadInventoryFromCloud();
    }
    
    public async void LoadInventoryFromCloud()
    {
        try
        {
            // Load from Unity Gaming Services Economy
            var inventoryResult = await EconomyService.Instance.PlayerInventory.GetInventoryAsync();
            // Process inventory data
            ProcessCloudInventory(inventoryResult);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to load inventory: {e.Message}");
        }
    }
    
    public bool AddItem(CatgirlItem item)
    {
        if (items.Count >= maxSlots) return false;
        
        items.Add(item);
        
        // Special handling for cow power items
        if (item.isCowPowerItem)
        {
            cowPowerItems.Add(item);
            TriggerCowPowerEffect();
        }
        
        // Diablo secret level item handling
        if (item.rarity == 5)
        {
            diabloSecretLevelItems.Add(item);
            UnlockSecretDiabloLevel();
        }
        
        return true;
    }
    
    private void TriggerCowPowerEffect()
    {
        Debug.Log("🐄 COW POWER ITEM ACQUIRED! Moo-gical effects activated! 🐄");
        // Activate special cow-themed visual effects
    }
    
    private void UnlockSecretDiabloLevel()
    {
        Debug.Log("💀 SECRET DIABLO LEVEL ITEM FOUND! Ancient cow portals opening... 💀");
        // Unlock secret content
    }
}
```

### 3. Universal Banking System

```csharp
// Assets/Scripts/Economy/UniversalBankingSystem.cs
using UnityEngine;
using Unity.Services.Economy;
using Unity.Netcode;

public class UniversalBankingSystem : NetworkBehaviour
{
    [Header("💰 Universal Banking")]
    public NetworkVariable<long> pinkCoins = new NetworkVariable<long>(0);
    public NetworkVariable<long> cowTokens = new NetworkVariable<long>(0);
    public NetworkVariable<long> eldritchCurrency = new NetworkVariable<long>(0);
    
    [Header("🎰 Gambling Systems")]
    public bool gamblingEnabled = true;
    public float houseEdge = 0.05f; // 5% house edge
    
    [Header("🏪 Auction House")]
    public bool auctionHouseActive = true;
    public float auctionFeePercent = 0.10f; // 10% auction fee
    
    public void ConnectToUniversalBank()
    {
        // Initialize connection to universal banking network
        Debug.Log("💎 Connected to Universal Banking System 💎");
        LoadPlayerBalances();
    }
    
    private async void LoadPlayerBalances()
    {
        try
        {
            // Load balances from Unity Gaming Services
            var balances = await EconomyService.Instance.PlayerBalances.GetBalancesAsync();
            // Update network variables with loaded balances
            ProcessBalanceData(balances);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Banking system error: {e.Message}");
        }
    }
    
    [ServerRpc(RequireOwnership = false)]
    public void GambleServerRpc(long amount, string gameType)
    {
        if (!gamblingEnabled) return;
        
        // Implement gambling logic with proper RNG
        bool win = UnityEngine.Random.Range(0f, 1f) > (0.5f + houseEdge);
        
        if (win)
        {
            long winnings = (long)(amount * 1.8f); // 80% payout on win
            pinkCoins.Value += winnings;
            TriggerWinEffectsClientRpc();
        }
        else
        {
            pinkCoins.Value = Mathf.Max(0, pinkCoins.Value - amount);
            TriggerLossEffectsClientRpc();
        }
    }
    
    [ClientRpc]
    private void TriggerWinEffectsClientRpc()
    {
        Debug.Log("🎊 JACKPOT! Pink coins rain from the sky! 🎊");
        // Trigger celebratory effects
    }
    
    [ClientRpc] 
    private void TriggerLossEffectsClientRpc()
    {
        Debug.Log("😿 Better luck next time, catgirl... 😿");
        // Trigger consolation effects
    }
}
```

## UI System Integration

### 1. UI Toolkit Setup for Inventory

```csharp
// Assets/Scripts/UI/InventoryUI.cs
using UnityEngine;
using UnityEngine.UIElements;

public class InventoryUI : MonoBehaviour
{
    private VisualElement root;
    private ListView inventoryList;
    private InventorySystem inventory;
    
    private void Start()
    {
        inventory = FindObjectOfType<InventorySystem>();
        
        var uiDocument = GetComponent<UIDocument>();
        root = uiDocument.rootVisualElement;
        
        SetupInventoryUI();
    }
    
    private void SetupInventoryUI()
    {
        // Create pink-themed UI with frilly borders
        root.style.backgroundColor = new Color(1f, 0.75f, 0.9f, 0.9f); // Pink background
        
        inventoryList = root.Q<ListView>("inventory-list");
        inventoryList.makeItem = () => CreateInventorySlot();
        inventoryList.bindItem = (element, index) => BindInventorySlot(element, index);
        inventoryList.itemsSource = inventory.items;
    }
    
    private VisualElement CreateInventorySlot()
    {
        var slot = new VisualElement();
        slot.AddToClassList("inventory-slot");
        
        // Add pink frilly styling via USS
        slot.style.borderTopColor = Color.magenta;
        slot.style.borderBottomColor = Color.magenta;
        slot.style.borderLeftColor = Color.magenta;
        slot.style.borderRightColor = Color.magenta;
        slot.style.borderTopWidth = 2f;
        slot.style.borderBottomWidth = 2f;
        slot.style.borderLeftWidth = 2f;
        slot.style.borderRightWidth = 2f;
        
        return slot;
    }
    
    private void BindInventorySlot(VisualElement element, int index)
    {
        var item = inventory.items[index];
        element.tooltip = $"{item.displayName}\n{item.description}";
        
        // Special styling for cow power items
        if (item.isCowPowerItem)
        {
            element.style.backgroundColor = new Color(0.8f, 0.6f, 0.4f); // Cow brown
        }
    }
}
```

## Animation & Mecanim Integration

### 1. Animator Controller Setup

```bash
# Create Animator Controller structure
mkdir -p Assets/Animations/Controllers
mkdir -p Assets/Animations/Clips/{Idle,Walk,Run,Jump,Purr,CowPower}

# Animation clips needed:
# - CatgirlIdle (pink sparkle effects)
# - CatgirlWalk (frilly dress animation)
# - CatgirlRun (power armor effects)
# - CatgirlJump (levitation purring)
# - CatgirlPurr (healing/buff animation)
# - SecretCowPower (transformation sequence)
```

### 2. Animation State Machine

```csharp
// Animation states for Mecanim controller:
// Base Layer:
//   ├── Idle → Walk (Speed > 0.1)
//   ├── Walk → Run (Speed > 5.0)  
//   ├── Any → Jump (IsJumping = true)
//   ├── Any → Purr (IsPurring = true)
//   └── Any → CowPower (CowPowerActive = true)
//
// Parameters:
//   - Speed (float): Movement velocity
//   - IsJumping (bool): Jump state trigger
//   - IsPurring (bool): Purring animation
//   - CowPowerActive (bool): Secret cow transformation
```

## Multiplayer & Networking

### 1. Netcode for GameObjects Setup

```csharp
// Assets/Scripts/Networking/CatgirlNetworkManager.cs  
using Unity.Netcode;
using UnityEngine;

public class CatgirlNetworkManager : NetworkManager
{
    [Header("🌸 Catgirl Network Configuration")]
    public GameObject catgirlPrefab;
    
    public override void OnClientConnectedCallback(ulong clientId)
    {
        base.OnClientConnectedCallback(clientId);
        
        if (IsServer)
        {
            SpawnCatgirlForPlayer(clientId);
        }
    }
    
    private void SpawnCatgirlForPlayer(ulong clientId)
    {
        var catgirlInstance = Instantiate(catgirlPrefab);
        catgirlInstance.GetComponent<NetworkObject>().SpawnAsPlayerObject(clientId, true);
        
        Debug.Log($"🐱 Catgirl spawned for client {clientId} 🐱");
    }
}
```

## Monetization Integration

### 1. Unity Gaming Services & IAP

```csharp
// Assets/Scripts/Economy/MonetizationManager.cs
using Unity.Services.Core;
using Unity.Services.Analytics;
using Unity.Services.Authentication;
using UnityEngine.Purchasing;

public class MonetizationManager : MonoBehaviour, IStoreListener
{
    [Header("💰 Monetization Products")]
    public string[] productIds = {
        "pink_coin_pack_small",
        "pink_coin_pack_mega", 
        "cow_power_unlock",
        "diablo_secret_access",
        "premium_catgirl_skin"
    };
    
    private async void Start()
    {
        await UnityServices.InitializeAsync();
        await AuthenticationService.Instance.SignInAnonymouslyAsync();
        
        AnalyticsService.Instance.StartDataCollection();
        InitializePurchasing();
    }
    
    public void InitializePurchasing()
    {
        var builder = ConfigurationBuilder.Instance(StandardPurchasingModule.Instance());
        
        foreach (string productId in productIds)
        {
            builder.AddProduct(productId, ProductType.Consumable);
        }
        
        UnityPurchasing.Initialize(this, builder);
    }
    
    public void BuyPinkCoins(string productId)
    {
        // Implement IAP purchase flow
        var product = CodelessIAPStoreListener.Instance.GetProduct(productId);
        if (product != null && product.availableToPurchase)
        {
            CodelessIAPStoreListener.Instance.InitiatePurchase(product);
        }
    }
    
    public PurchaseProcessingResult ProcessPurchase(PurchaseEventArgs args)
    {
        // Handle successful purchases
        string productId = args.purchasedProduct.definition.id;
        
        switch (productId)
        {
            case "cow_power_unlock":
                UnlockCowPowers();
                break;
            case "diablo_secret_access":
                UnlockDiabloSecretLevel();
                break;
        }
        
        return PurchaseProcessingResult.Complete;
    }
    
    private void UnlockCowPowers()
    {
        Debug.Log("🐄 COW POWERS PURCHASED! ETERNAL MOO-GICAL ABILITIES UNLOCKED! 🐄");
    }
    
    private void UnlockDiabloSecretLevel()
    {
        Debug.Log("💀 SECRET DIABLO COW LEVEL ACCESS GRANTED! 💀");
    }
    
    // Required IStoreListener methods
    public void OnInitialized(IStoreController controller, IExtensionProvider extensions) { }
    public void OnInitializeFailed(InitializationFailureReason error) { }
    public void OnPurchaseFailed(Product product, PurchaseFailureReason failureReason) { }
}
```

## Integration with MCP Infrastructure

### 1. VS Code Unity Extensions

Add to `.vscode/settings.json`:

```json
{
  "unity.enableExtensions": true,
  "unity.projectPath": "/workspace/catgirl-avatar-project",
  "unity.editorPath": "/opt/unity/Editor/Unity",
  "mcp.servers": {
    "unity-project": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace/catgirl-avatar-project"]
    }
  }
}
```

### 2. Development Workflow Integration

```bash
# Add Unity project to git tracking
cd /workspace/catgirl-avatar-project
git init
git remote add origin https://github.com/BambiSleepChat/catgirl-avatar-unity.git

# Create Unity-specific .gitignore
cat > .gitignore << 'EOF'
# Unity generated files
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/

# Visual Studio cache directory
.vs/

# Gradle cache directory
.gradle/

# Autogenerated VS/MD/Consulo solution and project files
ExportedObj/
.consulo/
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db

# Unity3D generated meta files
*.pidb.meta
*.pdb.meta
*.mdb.meta

# Unity3D generated file on crash reports
sysinfo.txt

# Builds
*.apk
*.unitypackage
*.aab

# Crashlytics generated file
crashlytics-build.properties

# Packed Addressables
/[Aa]ssets/[Aa]ddressable[Aa]ssets[Dd]ata/*/*.bin*

# Temporary auto-generated Android Assets
/[Aa]ssets/[Ss]treamingAssets/aa.meta
/[Aa]ssets/[Ss]treamingAssets/aa/*
EOF

# Initial commit
git add .
git commit -m "🌸 Initial Unity catgirl avatar project setup

- Unity 6.2 LTS configuration
- Pink frilly platinum blonde catgirl controller
- Inventory & universal banking systems  
- Monetization with cow power unlocks
- Secret diablo level item integration
- Multiplayer networking foundation

BambiSleep™ Church Sacred Development 💎"
```

## Build & Deployment Configuration

### 1. Platform Build Settings

```csharp
// Assets/Scripts/Build/BuildConfiguration.cs
using UnityEngine;
using UnityEditor;

public class BuildConfiguration
{
    [Header("🎯 Build Targets")]
    public static BuildTarget[] supportedPlatforms = {
        BuildTarget.StandaloneWindows64,
        BuildTarget.StandaloneLinux64, 
        BuildTarget.StandaloneOSX,
        BuildTarget.Android,
        BuildTarget.iOS,
        BuildTarget.WebGL
    };
    
    [MenuItem("BambiSleep/Build All Platforms")]
    public static void BuildAllPlatforms()
    {
        foreach (var platform in supportedPlatforms)
        {
            BuildPlatform(platform);
        }
    }
    
    private static void BuildPlatform(BuildTarget target)
    {
        string buildPath = $"Builds/{target}/CatgirlAvatar";
        
        BuildPlayerOptions buildOptions = new BuildPlayerOptions
        {
            scenes = EditorBuildSettings.scenes,
            locationPathName = buildPath,
            target = target,
            options = BuildOptions.None
        };
        
        BuildPipeline.BuildPlayer(buildOptions);
        Debug.Log($"✨ Build completed for {target} ✨");
    }
}
```

## Testing & Quality Assurance

### 1. Automated Testing Framework

```csharp
// Assets/Scripts/Tests/CatgirlSystemTests.cs
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using System.Collections;

public class CatgirlSystemTests
{
    [Test]
    public void CatgirlController_InitializesWithCorrectStats()
    {
        var catgirlGO = new GameObject();
        var controller = catgirlGO.AddComponent<CatgirlController>();
        
        Assert.AreEqual(9999, controller.stats.cuteness);
        Assert.IsTrue(controller.stats.hasSecretCowPowers);
        Assert.AreEqual(100.0f, controller.stats.frillinessLevel);
    }
    
    [UnityTest]
    public IEnumerator InventorySystem_AddsItemsCorrectly()
    {
        var inventoryGO = new GameObject();
        var inventory = inventoryGO.AddComponent<InventorySystem>();
        
        var testItem = new CatgirlItem
        {
            itemId = "test_cow_item",
            isCowPowerItem = true,
            rarity = 5
        };
        
        bool result = inventory.AddItem(testItem);
        
        Assert.IsTrue(result);
        Assert.Contains(testItem, inventory.items);
        Assert.Contains(testItem, inventory.cowPowerItems);
        
        yield return null;
    }
    
    [Test]
    public void UniversalBanking_HandlesCurrencyCorrectly()
    {
        var bankingGO = new GameObject();
        var banking = bankingGO.AddComponent<UniversalBankingSystem>();
        
        // Test initial state
        Assert.AreEqual(0, banking.pinkCoins.Value);
        Assert.AreEqual(0, banking.cowTokens.Value);
    }
}
```

## Documentation & Community

### 1. API Documentation

```bash
# Generate documentation using DocFX
cd /workspace/catgirl-avatar-project
mkdir -p Documentation/{api,manual,tutorials}

# Create docfx.json configuration
cat > Documentation/docfx.json << 'EOF'
{
  "metadata": [{
    "src": [{"files": ["Assets/Scripts/**/*.cs"]}],
    "dest": "api",
    "properties": {
      "TargetFramework": "netstandard2.1"
    }
  }],
  "build": {
    "content": [
      {"files": ["api/*.yml"], "dest": "api"},
      {"files": ["manual/*.md"], "dest": "manual"},
      {"files": ["tutorials/*.md"], "dest": "tutorials"}
    ],
    "dest": "_site"
  }
}
EOF
```

## Conclusion

This Unity setup guide provides a complete foundation for developing the Pink Frilly Platinum Blonde Catgirl Avatar System with:

- ✨ **Character System**: Full catgirl controller with purring, pink aura, and cow powers
- 💰 **Economy Integration**: Universal banking, gambling, and auction systems  
- 🎮 **Multiplayer Support**: Netcode for GameObjects with synchronized catgirl spawning
- 💎 **Monetization**: Unity Gaming Services with IAP for cow power unlocks
- 🎨 **UI Systems**: UI Toolkit with pink frilly theming
- 🔧 **MCP Integration**: Seamless development workflow with existing infrastructure

**Sacred Mantra Compliance**: This setup achieves the 8/8 operational status goal by integrating Unity development into our existing MCP server ecosystem while maintaining the Universal Machine Philosophy of cross-platform compatibility.

**Next Steps**:
1. Install Unity Hub and Unity 6.2 LTS
2. Create catgirl avatar project using provided templates
3. Configure Unity Gaming Services for monetization
4. Implement character animations and pink frilly effects
5. Test multiplayer networking with cow power synchronization
6. Deploy to all supported platforms for universal catgirl access

*🌸 May your code be pink, your catgirls frilly, and your cow powers eternally secret 🌸*