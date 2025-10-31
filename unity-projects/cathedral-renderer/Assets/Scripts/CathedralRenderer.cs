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
    /// Listen for commands from Node.js bridge (stdin)
    /// </summary>
    IEnumerator CommandListener()
    {
      while (true)
      {
        if (Console.KeyAvailable)
        {
          string input = Console.ReadLine();
          if (!string.IsNullOrEmpty(input))
          {
            ProcessCommand(input);
          }
        }

        yield return new WaitForSeconds(0.1f);
      }
    }

    /// <summary>
    /// Process JSON command from Node.js
    /// </summary>
    void ProcessCommand(string commandJson)
    {
      try
      {
        var command = JsonUtility.FromJson<CommandData>(commandJson);

        switch (command.type)
        {
          case "updateConfig":
            UpdateStyleFromJson(command.config);
            RegenerateCathedral();
            break;

          case "triggerEffect":
            TriggerEffect(command.effectType, command.parameters);
            break;

          case "quit":
            Debug.Log("Quit command received, shutting down...");
#if UNITY_EDITOR
                        UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
            break;
        }
      }
      catch (Exception e)
      {
        Debug.LogError($"Failed to process command: {e.Message}");
      }
    }

    /// <summary>
    /// Update style from JSON config
    /// </summary>
    void UpdateStyleFromJson(string configJson)
    {
      style = JsonUtility.FromJson<CathedralStyle>(configJson);
      Debug.Log($"Style updated: {style.style}");
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
    class CommandData
    {
      public string type;
      public string config;
      public string effectType;
      public string parameters;
    }
  }
}
