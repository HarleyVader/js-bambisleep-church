/**
 * BambiSleep™ Church - Neon Cyber Goth Cathedral Renderer
 * Unity C# script for procedural cathedral generation with electro-nuclear aesthetics
 * Integrates with Node.js MCP Control Tower via stdin/stdout
 */

using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// Cathedral visual style configuration
  /// </summary>
  [System.Serializable]
  public class CathedralStyle
  {
    [Header("🌸 Neon Cyber Goth Configuration")]
    public string style = "neon-cyber-goth";
    public string lighting = "electro-nuclear";
    public bool catholicVibes = true;

    [Range(0f, 1f)]
    public float pinkIntensity = 0.8f;

    [Range(0, 1000)]
    public int eldritchLevel = 666;

    [Header("💎 Architectural Parameters")]
    public float heightMultiplier = 50f;
    public float naveWidth = 20f;
    public int archCount = 12;
    public bool hasRosettaWindow = true;
    public bool hasFlyingButtresses = true;

    [Header("✨ Neon Effects")]
    public Color primaryNeonColor = Color.magenta;
    public Color secondaryNeonColor = Color.cyan;
    public float neonIntensity = 10f;
    public float neonFlickerSpeed = 0.5f;

    [Header("⚡ Nuclear Glow")]
    public Color nuclearGlowColor = new Color(0f, 1f, 0.5f, 1f);
    public float nuclearPulseSpeed = 2f;
    public float radiationIntensity = 5f;
  }

  /// <summary>
  /// Main cathedral renderer - listens for commands from Node.js bridge
  /// </summary>
  public class CathedralRenderer : MonoBehaviour
  {
    [Header("🌸 Cathedral Configuration")]
    public CathedralStyle style = new CathedralStyle();

    [Header("🎨 Rendering")]
    public Material neonMaterial;
    public Material stainedGlassMaterial;
    public Material nuclearGlowMaterial;

    private GameObject cathedralRoot;
    private List<Light> neonLights = new List<Light>();
    private List<ParticleSystem> glowParticles = new List<ParticleSystem>();
    private bool isServerMode = false;

    void Start()
    {
      Debug.Log("🌸 BambiSleep™ Cathedral Renderer Starting...");

      // Check if running in batch mode (from Node.js)
      isServerMode = Application.isBatchMode;

      if (isServerMode)
      {
        Debug.Log("💎 Running in server mode - listening for commands");
        StartCoroutine(CommandListener());
        StartCoroutine(HeartbeatLoop());
      }

      GenerateCathedral();

      Debug.Log("✨ Cathedral Ready");
    }

    /// <summary>
    /// Generate procedural cathedral geometry
    /// </summary>
    void GenerateCathedral()
    {
      cathedralRoot = new GameObject("BambiSleep_Cathedral");

      // Generate main structure
      GenerateNave();
      GenerateTransept();
      GenerateApse();
      GenerateVaulting();
      GenerateRosettaWindow();
      GenerateFlyingButtresses();
      GenerateSpires();

      // Apply neon cyber goth styling
      ApplyNeonEffects();
      ApplyNuclearGlow();
      SetupLighting();

      Debug.Log($"🏰 Cathedral generated with {style.archCount} arches and {style.eldritchLevel} eldritch power");
    }

    /// <summary>
    /// Generate cathedral nave (main hall)
    /// </summary>
    void GenerateNave()
    {
      GameObject nave = GameObject.CreatePrimitive(PrimitiveType.Cube);
      nave.name = "Nave";
      nave.transform.parent = cathedralRoot.transform;

      // Scale to cathedral proportions
      nave.transform.localScale = new Vector3(
          style.naveWidth,
          style.heightMultiplier,
          style.naveWidth * 3f
      );

      nave.transform.position = Vector3.up * (style.heightMultiplier / 2f);

      // Apply neon material
      var renderer = nave.GetComponent<Renderer>();
      renderer.material = CreateNeonMaterial(style.primaryNeonColor);

      Debug.Log("🏛️ Nave generated");
    }

    /// <summary>
    /// Generate transept (cross section)
    /// </summary>
    void GenerateTransept()
    {
      GameObject transept = GameObject.CreatePrimitive(PrimitiveType.Cube);
      transept.name = "Transept";
      transept.transform.parent = cathedralRoot.transform;

      transept.transform.localScale = new Vector3(
          style.naveWidth * 2f,
          style.heightMultiplier * 0.8f,
          style.naveWidth * 0.8f
      );

      transept.transform.position = new Vector3(
          0f,
          style.heightMultiplier * 0.4f,
          style.naveWidth
      );

      var renderer = transept.GetComponent<Renderer>();
      renderer.material = CreateNeonMaterial(style.secondaryNeonColor);

      Debug.Log("✝️ Transept generated");
    }

    /// <summary>
    /// Generate apse (altar area)
    /// </summary>
    void GenerateApse()
    {
      GameObject apse = GameObject.CreatePrimitive(PrimitiveType.Sphere);
      apse.name = "Apse";
      apse.transform.parent = cathedralRoot.transform;

      apse.transform.localScale = Vector3.one * style.naveWidth * 1.2f;
      apse.transform.position = new Vector3(
          0f,
          style.heightMultiplier * 0.3f,
          style.naveWidth * 1.5f
      );

      var renderer = apse.GetComponent<Renderer>();
      renderer.material = CreateNuclearGlowMaterial();

      Debug.Log("💒 Apse generated");
    }

    /// <summary>
    /// Generate gothic vaulting
    /// </summary>
    void GenerateVaulting()
    {
      for (int i = 0; i < style.archCount; i++)
      {
        float zPos = (i - style.archCount / 2f) * (style.naveWidth * 3f / style.archCount);

        GameObject arch = CreateGothicArch(zPos);
        arch.transform.parent = cathedralRoot.transform;
      }

      Debug.Log($"🌈 {style.archCount} gothic arches generated");
    }

    /// <summary>
    /// Create single gothic arch
    /// </summary>
    GameObject CreateGothicArch(float zPosition)
    {
      GameObject arch = new GameObject($"Arch_{zPosition}");

      // Left pillar
      GameObject leftPillar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      leftPillar.transform.parent = arch.transform;
      leftPillar.transform.localScale = new Vector3(1f, style.heightMultiplier * 0.4f, 1f);
      leftPillar.transform.position = new Vector3(-style.naveWidth / 2f, style.heightMultiplier * 0.4f, zPosition);

      // Right pillar
      GameObject rightPillar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      rightPillar.transform.parent = arch.transform;
      rightPillar.transform.localScale = new Vector3(1f, style.heightMultiplier * 0.4f, 1f);
      rightPillar.transform.position = new Vector3(style.naveWidth / 2f, style.heightMultiplier * 0.4f, zPosition);

      // Apply neon materials
      leftPillar.GetComponent<Renderer>().material = CreateNeonMaterial(Color.Lerp(style.primaryNeonColor, style.secondaryNeonColor, 0.5f));
      rightPillar.GetComponent<Renderer>().material = CreateNeonMaterial(Color.Lerp(style.primaryNeonColor, style.secondaryNeonColor, 0.5f));

      return arch;
    }

    /// <summary>
    /// Generate rosetta window (circular stained glass)
    /// </summary>
    void GenerateRosettaWindow()
    {
      if (!style.hasRosettaWindow) return;

      GameObject rosetta = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      rosetta.name = "RosettaWindow";
      rosetta.transform.parent = cathedralRoot.transform;

      rosetta.transform.localScale = new Vector3(style.naveWidth * 0.8f, 0.5f, style.naveWidth * 0.8f);
      rosetta.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
      rosetta.transform.position = new Vector3(
          0f,
          style.heightMultiplier * 0.7f,
          -style.naveWidth * 1.5f
      );

      var renderer = rosetta.GetComponent<Renderer>();
      renderer.material = CreateStainedGlassMaterial();

      // Add rotating light behind it
      GameObject rosettaLight = new GameObject("RosettaLight");
      rosettaLight.transform.parent = rosetta.transform;
      rosettaLight.transform.localPosition = Vector3.forward * 2f;

      Light light = rosettaLight.AddComponent<Light>();
      light.type = LightType.Spot;
      light.color = style.primaryNeonColor;
      light.intensity = style.neonIntensity * 2f;
      light.range = style.naveWidth * 2f;

      neonLights.Add(light);

      Debug.Log("🌹 Rosetta window generated");
    }

    /// <summary>
    /// Generate flying buttresses (external support)
    /// </summary>
    void GenerateFlyingButtresses()
    {
      if (!style.hasFlyingButtresses) return;

      for (int i = 0; i < style.archCount; i++)
      {
        float zPos = (i - style.archCount / 2f) * (style.naveWidth * 3f / style.archCount);

        // Left buttress
        CreateButtress(new Vector3(-style.naveWidth * 0.8f, style.heightMultiplier * 0.5f, zPos), true);

        // Right buttress
        CreateButtress(new Vector3(style.naveWidth * 0.8f, style.heightMultiplier * 0.5f, zPos), false);
      }

      Debug.Log("🏗️ Flying buttresses generated");
    }

    /// <summary>
    /// Create single flying buttress
    /// </summary>
    void CreateButtress(Vector3 position, bool leftSide)
    {
      GameObject buttress = GameObject.CreatePrimitive(PrimitiveType.Cube);
      buttress.name = $"Buttress_{position.z}_{(leftSide ? "L" : "R")}";
      buttress.transform.parent = cathedralRoot.transform;

      buttress.transform.position = position;
      buttress.transform.localScale = new Vector3(2f, style.heightMultiplier * 0.3f, 1f);
      buttress.transform.rotation = Quaternion.Euler(0f, 0f, leftSide ? -30f : 30f);

      var renderer = buttress.GetComponent<Renderer>();
      renderer.material = CreateNeonMaterial(style.secondaryNeonColor);
    }

    /// <summary>
    /// Generate gothic spires
    /// </summary>
    void GenerateSpires()
    {
      // Main central spire
      CreateSpire(Vector3.zero, style.heightMultiplier * 1.5f);

      // Corner spires
      float offset = style.naveWidth * 0.7f;
      CreateSpire(new Vector3(-offset, 0f, -style.naveWidth * 1.5f), style.heightMultiplier);
      CreateSpire(new Vector3(offset, 0f, -style.naveWidth * 1.5f), style.heightMultiplier);

      Debug.Log("🗼 Gothic spires generated");
    }

    /// <summary>
    /// Create single spire
    /// </summary>
    void CreateSpire(Vector3 basePosition, float height)
    {
      GameObject spire = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      spire.name = $"Spire_{basePosition}";
      spire.transform.parent = cathedralRoot.transform;

      spire.transform.position = basePosition + Vector3.up * height / 2f;
      spire.transform.localScale = new Vector3(2f, height / 2f, 2f);

      var renderer = spire.GetComponent<Renderer>();
      renderer.material = CreateNuclearGlowMaterial();

      // Add point light at top
      GameObject spireLight = new GameObject("SpireLight");
      spireLight.transform.parent = spire.transform;
      spireLight.transform.localPosition = Vector3.up * height / 2f;

      Light light = spireLight.AddComponent<Light>();
      light.type = LightType.Point;
      light.color = style.nuclearGlowColor;
      light.intensity = style.radiationIntensity;
      light.range = height;

      neonLights.Add(light);
    }

    /// <summary>
    /// Apply neon effects throughout cathedral
    /// </summary>
    void ApplyNeonEffects()
    {
      // Find all renderers and apply neon edge glow
      Renderer[] renderers = cathedralRoot.GetComponentsInChildren<Renderer>();

      foreach (Renderer renderer in renderers)
      {
        // Enable emission
        renderer.material.EnableKeyword("_EMISSION");
        renderer.material.SetColor("_EmissionColor", style.primaryNeonColor * style.neonIntensity);
      }

      Debug.Log("✨ Neon effects applied");
    }

    /// <summary>
    /// Apply nuclear glow effects
    /// </summary>
    void ApplyNuclearGlow()
    {
      // Create particle systems for radiation effect
      for (int i = 0; i < 10; i++)
      {
        GameObject particleGO = new GameObject($"NuclearGlow_{i}");
        particleGO.transform.parent = cathedralRoot.transform;
        particleGO.transform.position = new Vector3(
            UnityEngine.Random.Range(-style.naveWidth, style.naveWidth),
            UnityEngine.Random.Range(0f, style.heightMultiplier),
            UnityEngine.Random.Range(-style.naveWidth * 1.5f, style.naveWidth * 1.5f)
        );

        ParticleSystem ps = particleGO.AddComponent<ParticleSystem>();
        var main = ps.main;
        main.startColor = style.nuclearGlowColor;
        main.startSize = 0.5f;
        main.startLifetime = 3f;
        main.startSpeed = 1f;

        var emission = ps.emission;
        emission.rateOverTime = 10f;

        glowParticles.Add(ps);
      }

      Debug.Log("⚡ Nuclear glow applied");
    }

    /// <summary>
    /// Setup dynamic lighting
    /// </summary>
    void SetupLighting()
    {
      // Ambient lighting
      RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
      RenderSettings.ambientLight = style.primaryNeonColor * 0.2f;

      // Fog for atmospheric effect
      RenderSettings.fog = true;
      RenderSettings.fogColor = style.nuclearGlowColor * 0.3f;
      RenderSettings.fogMode = FogMode.Exponential;
      RenderSettings.fogDensity = 0.01f;

      Debug.Log("💡 Lighting configured");
    }

    /// <summary>
    /// Create neon material
    /// </summary>
    Material CreateNeonMaterial(Color neonColor)
    {
      Material mat = new Material(Shader.Find("Standard"));
      mat.EnableKeyword("_EMISSION");
      mat.SetColor("_Color", neonColor * 0.5f);
      mat.SetColor("_EmissionColor", neonColor * style.neonIntensity);
      mat.SetFloat("_Metallic", 0.8f);
      mat.SetFloat("_Glossiness", 0.9f);
      return mat;
    }

    /// <summary>
    /// Create stained glass material
    /// </summary>
    Material CreateStainedGlassMaterial()
    {
      Material mat = new Material(Shader.Find("Standard"));
      mat.EnableKeyword("_EMISSION");
      mat.SetColor("_Color", new Color(1f, 0f, 1f, 0.5f));
      mat.SetColor("_EmissionColor", style.primaryNeonColor * style.neonIntensity * 3f);
      mat.SetFloat("_Metallic", 0f);
      mat.SetFloat("_Glossiness", 1f);
      mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
      mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
      mat.SetInt("_ZWrite", 0);
      mat.DisableKeyword("_ALPHATEST_ON");
      mat.EnableKeyword("_ALPHABLEND_ON");
      mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
      mat.renderQueue = 3000;
      return mat;
    }

    /// <summary>
    /// Create nuclear glow material
    /// </summary>
    Material CreateNuclearGlowMaterial()
    {
      Material mat = new Material(Shader.Find("Standard"));
      mat.EnableKeyword("_EMISSION");
      mat.SetColor("_Color", style.nuclearGlowColor * 0.3f);
      mat.SetColor("_EmissionColor", style.nuclearGlowColor * style.radiationIntensity);
      mat.SetFloat("_Metallic", 1f);
      mat.SetFloat("_Glossiness", 1f);
      return mat;
    }

    /// <summary>
    /// Animate neon effects
    /// </summary>
    void Update()
    {
      // Flicker neon lights
      foreach (Light light in neonLights)
      {
        float flicker = Mathf.PerlinNoise(Time.time * style.neonFlickerSpeed, 0f);
        light.intensity = style.neonIntensity * (0.8f + flicker * 0.4f);
      }

      // Pulse nuclear glow
      float pulse = Mathf.Sin(Time.time * style.nuclearPulseSpeed) * 0.5f + 0.5f;
      RenderSettings.ambientLight = style.primaryNeonColor * (0.2f + pulse * 0.3f);
    }

    /// <summary>
    /// Listen for commands from Node.js bridge (stdin) - IPC Protocol v1.0.0
    /// </summary>
    IEnumerator CommandListener()
    {
      Debug.Log("🔮 IPC Command Listener started (Protocol v1.0.0)");

      while (true)
      {
        if (Console.KeyAvailable)
        {
          string input = Console.ReadLine();
          if (!string.IsNullOrEmpty(input))
          {
            ProcessIPCMessage(input);
          }
        }

        yield return new WaitForSeconds(0.1f);
      }
    }

    /// <summary>
    /// Process JSON IPC message from Node.js (Protocol v1.0.0)
    /// </summary>
    void ProcessIPCMessage(string messageJson)
    {
      try
      {
        var message = JsonUtility.FromJson<IPCMessage>(messageJson);

        if (string.IsNullOrEmpty(message.type))
        {
          SendError("INVALID_MESSAGE", "Message type is required", "");
          return;
        }

        Debug.Log($"📨 IPC Message received: {message.type}");

        switch (message.type)
        {
          case "initialize":
            ProcessInitialize(message.data);
            break;

          case "updateStyle":
            ProcessUpdateStyle(message.data);
            break;

          case "camera":
            ProcessCameraControl(message.data);
            break;

          case "render":
            ProcessRenderCommand(message.data);
            break;

          case "postprocessing":
            ProcessPostProcessing(message.data);
            break;

          case "setPaused":
            ProcessSetPaused(message.data);
            break;

          case "shutdown":
            ProcessShutdown(message.data);
            break;

          default:
            SendError("INVALID_MESSAGE", $"Unknown message type: {message.type}", "");
            break;
        }
      }
      catch (Exception e)
      {
        SendError("INVALID_MESSAGE", $"Failed to parse JSON: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process initialize command
    /// </summary>
    void ProcessInitialize(string dataJson)
    {
      try
      {
        var initData = JsonUtility.FromJson<InitializeData>(dataJson);

        // Update style parameters
        if (initData.pinkIntensity >= 0)
          style.pinkIntensity = Mathf.Clamp01(initData.pinkIntensity);
        if (initData.eldritchLevel >= 0)
          style.eldritchLevel = Mathf.Clamp(initData.eldritchLevel, 0, 1000);
        if (initData.neonIntensity >= 0)
          style.neonIntensity = initData.neonIntensity;
        if (initData.archCount > 0)
          style.archCount = initData.archCount;

        RegenerateCathedral();

        // Send scene-loaded acknowledgment
        SendIPCMessage("scene-loaded", JsonUtility.ToJson(new SceneLoadedData
        {
          sceneName = initData.sceneName,
          objectCount = cathedralRoot.transform.childCount,
          renderTime = Time.realtimeSinceStartup
        }));
      }
      catch (Exception e)
      {
        SendError("SCENE_LOAD_FAILED", $"Failed to initialize: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process updateStyle command
    /// </summary>
    void ProcessUpdateStyle(string dataJson)
    {
      try
      {
        var updateData = JsonUtility.FromJson<UpdateStyleData>(dataJson);

        bool updated = false;

        if (updateData.pinkIntensity >= 0)
        {
          style.pinkIntensity = Mathf.Clamp01(updateData.pinkIntensity);
          updated = true;
        }

        if (updateData.eldritchLevel >= 0)
        {
          style.eldritchLevel = Mathf.Clamp(updateData.eldritchLevel, 0, 1000);
          updated = true;
        }

        if (updateData.neonFlickerSpeed >= 0)
        {
          style.neonFlickerSpeed = updateData.neonFlickerSpeed;
          updated = true;
        }

        if (updateData.nuclearPulseSpeed >= 0)
        {
          style.nuclearPulseSpeed = updateData.nuclearPulseSpeed;
          updated = true;
        }

        if (updated)
        {
          ApplyNeonEffects();

          // Send update-ack
          SendIPCMessage("update-ack", JsonUtility.ToJson(new UpdateAckData
          {
            success = true,
            pinkIntensity = style.pinkIntensity,
            eldritchLevel = style.eldritchLevel
          }));
        }
      }
      catch (Exception e)
      {
        SendError("PARAMETER_OUT_OF_RANGE", $"Failed to update style: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process camera control command
    /// </summary>
    void ProcessCameraControl(string dataJson)
    {
      try
      {
        var cameraData = JsonUtility.FromJson<CameraData>(dataJson);
        Camera mainCamera = Camera.main;

        if (mainCamera != null)
        {
          if (cameraData.position != null)
            mainCamera.transform.position = new Vector3(cameraData.position.x, cameraData.position.y, cameraData.position.z);

          if (cameraData.rotation != null)
            mainCamera.transform.rotation = Quaternion.Euler(cameraData.rotation.x, cameraData.rotation.y, cameraData.rotation.z);

          if (cameraData.fieldOfView > 0)
            mainCamera.fieldOfView = cameraData.fieldOfView;
        }
      }
      catch (Exception e)
      {
        SendError("RENDER_FAILED", $"Failed to update camera: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process render command
    /// </summary>
    void ProcessRenderCommand(string dataJson)
    {
      try
      {
        var renderData = JsonUtility.FromJson<RenderData>(dataJson);
        StartCoroutine(CaptureScreenshot(renderData));
      }
      catch (Exception e)
      {
        SendError("RENDER_FAILED", $"Failed to render: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Capture screenshot to file
    /// </summary>
    IEnumerator CaptureScreenshot(RenderData renderData)
    {
      yield return new WaitForEndOfFrame();

      float startTime = Time.realtimeSinceStartup;

      try
      {
        Texture2D screenshot = new Texture2D(renderData.width, renderData.height, TextureFormat.RGB24, false);
        screenshot.ReadPixels(new Rect(0, 0, renderData.width, renderData.height), 0, 0);
        screenshot.Apply();

        byte[] bytes = renderData.format == "PNG" ? screenshot.EncodeToPNG() : screenshot.EncodeToJPG();
        File.WriteAllBytes(renderData.outputPath, bytes);

        float renderTime = Time.realtimeSinceStartup - startTime;

        SendIPCMessage("render-complete", JsonUtility.ToJson(new RenderCompleteData
        {
          outputPath = renderData.outputPath,
          renderTime = renderTime * 1000f, // Convert to milliseconds
          width = renderData.width,
          height = renderData.height
        }));

        Destroy(screenshot);
      }
      catch (Exception e)
      {
        SendError("RENDER_FAILED", $"Screenshot capture failed: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process post-processing command
    /// </summary>
    void ProcessPostProcessing(string dataJson)
    {
      // Post-processing would be implemented with Unity's Post Processing Stack
      // Placeholder for now
      Debug.Log($"Post-processing updated: {dataJson}");
    }

    /// <summary>
    /// Process setPaused command
    /// </summary>
    void ProcessSetPaused(string dataJson)
    {
      var pauseData = JsonUtility.FromJson<PauseData>(dataJson);
      Time.timeScale = pauseData.paused ? 0f : 1f;
      Debug.Log($"Time scale set to: {Time.timeScale}");
    }

    /// <summary>
    /// Process shutdown command
    /// </summary>
    void ProcessShutdown(string dataJson)
    {
      Debug.Log("🌸 Shutdown command received");

      SendIPCMessage("shutdownComplete", JsonUtility.ToJson(new ShutdownData
      {
        totalFrames = Time.frameCount,
        uptime = Time.realtimeSinceStartup * 1000f // Convert to milliseconds
      }));

      StartCoroutine(GracefulShutdown());
    }

    /// <summary>
    /// Gracefully shutdown Unity
    /// </summary>
    IEnumerator GracefulShutdown()
    {
      yield return new WaitForSeconds(0.5f);

#if UNITY_EDITOR
      UnityEditor.EditorApplication.isPlaying = false;
#else
      Application.Quit();
#endif
    }

    /// <summary>
    /// Send IPC message to Node.js via stdout (Protocol v1.0.0)
    /// </summary>
    void SendIPCMessage(string type, string dataJson)
    {
      var message = new
      {
        type = type,
        timestamp = DateTime.UtcNow.ToString("o"),
        data = dataJson
      };

      string json = JsonUtility.ToJson(message);
      Console.WriteLine(json);
    }

    /// <summary>
    /// Send error message to Node.js
    /// </summary>
    void SendError(string errorCode, string message, string stack)
    {
      var errorData = new ErrorData
      {
        errorCode = errorCode,
        message = message,
        stack = stack
      };

      SendIPCMessage("error", JsonUtility.ToJson(errorData));
    }

    /// <summary>
    /// Send periodic heartbeat
    /// </summary>
    IEnumerator HeartbeatLoop()
    {
      while (true)
      {
        yield return new WaitForSeconds(5f);

        if (isServerMode)
        {
          SendIPCMessage("heartbeat", JsonUtility.ToJson(new HeartbeatData
          {
            fps = (int)(1f / Time.deltaTime),
            memoryUsageMB = (int)(UnityEngine.Profiling.Profiler.GetTotalAllocatedMemoryLong() / 1024 / 1024),
            activeObjects = cathedralRoot != null ? cathedralRoot.transform.childCount : 0
          }));
        }
      }
    }

    /// <summary>
    /// Regenerate cathedral with new config
    /// </summary>
    void RegenerateCathedral()
    {
      if (cathedralRoot != null)
      {
        Destroy(cathedralRoot);
      }

      neonLights.Clear();
      glowParticles.Clear();

      GenerateCathedral();
    }

    /// <summary>
    /// Trigger special effects
    /// </summary>
    void TriggerEffect(string effectType, string parametersJson)
    {
      Debug.Log($"Triggering effect: {effectType}");

      switch (effectType)
      {
        case "holy-blast":
          StartCoroutine(HolyBlastEffect());
          break;

        case "neon-pulse":
          StartCoroutine(NeonPulseEffect());
          break;

        case "nuclear-surge":
          StartCoroutine(NuclearSurgeEffect());
          break;
      }
    }

    IEnumerator HolyBlastEffect()
    {
      // Intense white light burst
      foreach (Light light in neonLights)
      {
        light.intensity *= 10f;
        light.color = Color.white;
      }

      yield return new WaitForSeconds(0.5f);

      // Return to normal
      foreach (Light light in neonLights)
      {
        light.intensity /= 10f;
        light.color = style.primaryNeonColor;
      }
    }

    IEnumerator NeonPulseEffect()
    {
      // Rapid color cycling
      float duration = 3f;
      float elapsed = 0f;

      while (elapsed < duration)
      {
        Color lerpColor = Color.Lerp(style.primaryNeonColor, style.secondaryNeonColor, Mathf.PingPong(elapsed * 2f, 1f));

        foreach (Light light in neonLights)
        {
          light.color = lerpColor;
        }

        elapsed += Time.deltaTime;
        yield return null;
      }

      // Reset
      foreach (Light light in neonLights)
      {
        light.color = style.primaryNeonColor;
      }
    }

    IEnumerator NuclearSurgeEffect()
    {
      // Intense radiation pulse
      foreach (ParticleSystem ps in glowParticles)
      {
        var emission = ps.emission;
        emission.rateOverTime = 100f;
      }

      yield return new WaitForSeconds(2f);

      // Return to normal
      foreach (ParticleSystem ps in glowParticles)
      {
        var emission = ps.emission;
        emission.rateOverTime = 10f;
      }
    }

    /// <summary>
    /// Static method for Unity batch mode execution
    /// </summary>
    public static void StartServer()
    {
      Debug.Log("🌸 Starting BambiSleep™ Cathedral Server...");

      // Create scene
      GameObject cathedralGO = new GameObject("CathedralRenderer");
      cathedralGO.AddComponent<CathedralRenderer>();

      // Setup camera
      GameObject cameraGO = new GameObject("Camera");
      Camera camera = cameraGO.AddComponent<Camera>();
      camera.transform.position = new Vector3(0f, 25f, -50f);
      camera.transform.LookAt(Vector3.zero);

      Debug.Log("✨ Cathedral Server Ready");
    }

    [System.Serializable]
    class IPCMessage
    {
      public string type;
      public string timestamp;
      public string data;
    }

    [System.Serializable]
    class InitializeData
    {
      public string sceneName;
      public float pinkIntensity = -1f;
      public int eldritchLevel = -1;
      public float neonIntensity = -1f;
      public int archCount = -1;
      public float cathedralWidth = -1f;
      public float cathedralLength = -1f;
      public float cathedralHeight = -1f;
    }

    [System.Serializable]
    class UpdateStyleData
    {
      public float pinkIntensity = -1f;
      public int eldritchLevel = -1;
      public float neonFlickerSpeed = -1f;
      public float nuclearPulseSpeed = -1f;
    }

    [System.Serializable]
    class CameraData
    {
      public Vector3Data position;
      public Vector3Data rotation;
      public float fieldOfView;
    }

    [System.Serializable]
    class Vector3Data
    {
      public float x;
      public float y;
      public float z;
    }

    [System.Serializable]
    class RenderData
    {
      public string outputPath;
      public int width = 1920;
      public int height = 1080;
      public string format = "PNG";
    }

    [System.Serializable]
    class PauseData
    {
      public bool paused;
    }

    [System.Serializable]
    class SceneLoadedData
    {
      public string sceneName;
      public int objectCount;
      public float renderTime;
    }

    [System.Serializable]
    class UpdateAckData
    {
      public bool success;
      public float pinkIntensity;
      public int eldritchLevel;
    }

    [System.Serializable]
    class RenderCompleteData
    {
      public string outputPath;
      public float renderTime;
      public int width;
      public int height;
    }

    [System.Serializable]
    class ErrorData
    {
      public string errorCode;
      public string message;
      public string stack;
    }

    [System.Serializable]
    class HeartbeatData
    {
      public int fps;
      public int memoryUsageMB;
      public int activeObjects;
    }

    [System.Serializable]
    class ShutdownData
    {
      public int totalFrames;
      public float uptime;
    }
  }
}
