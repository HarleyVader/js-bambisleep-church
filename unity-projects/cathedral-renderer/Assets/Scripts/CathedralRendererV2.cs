/**
 * BambiSleep™ Church - Cathedral Renderer (Refactored)
 * Procedural gothic cathedral generator with neon cyber goth aesthetic
 * Modernized architecture with separated concerns
 */

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// Main cathedral renderer with procedural generation
  /// Uses VFXController, PostProcessingController, and CinemachineController
  /// </summary>
  public class CathedralRendererV2 : MonoBehaviour
  {
    [Header("🌸 Cathedral Style Configuration")]
    public CathedralStyle style = new CathedralStyle();

    [Header("📐 Geometry Configuration")]
    public float cathedralWidth = 30f;
    public float cathedralLength = 60f;
    public float cathedralHeight = 40f;
    public int archCount = 5;
    public float wallThickness = 2f;

    [Header("🎨 Modern Controllers")]
    public VFXController vfxController;
    public PostProcessingController postProcessingController;
    public CinemachineController cinemachineController;
    public IPCBridge ipcBridge;

    // Cathedral geometry
    private GameObject cathedralRoot;
    private List<Light> neonLights = new List<Light>();

    private void Awake()
    {
      InitializeControllers();
    }

    private void Start()
    {
      GenerateCathedral();
      ApplyVisualEffects();

      // Register IPC callbacks if in server mode
      if (Application.isBatchMode && ipcBridge != null)
      {
        RegisterIPCCallbacks();
      }
    }

    /// <summary>
    /// Initialize all controller components
    /// </summary>
    void InitializeControllers()
    {
      // Find or create VFX controller
      if (vfxController == null)
      {
        vfxController = GetComponent<VFXController>();
        if (vfxController == null)
        {
          vfxController = gameObject.AddComponent<VFXController>();
        }
      }

      // Find or create post-processing controller
      if (postProcessingController == null)
      {
        postProcessingController = GetComponent<PostProcessingController>();
        if (postProcessingController == null)
        {
          postProcessingController = gameObject.AddComponent<PostProcessingController>();
        }
      }

      // Find or create Cinemachine controller
      if (cinemachineController == null)
      {
        cinemachineController = GetComponent<CinemachineController>();
        if (cinemachineController == null)
        {
          cinemachineController = gameObject.AddComponent<CinemachineController>();
        }
      }

      // Find IPC bridge
      if (ipcBridge == null)
      {
        ipcBridge = GetComponent<IPCBridge>();
      }

      Debug.Log("✅ Controllers initialized");
    }

    /// <summary>
    /// Register IPC callbacks for Node.js communication
    /// </summary>
    void RegisterIPCCallbacks()
    {
      if (ipcBridge == null)
      {
        Debug.LogWarning("⚠️ IPCBridge not found");
        return;
      }

      ipcBridge.OnInitializeReceived += OnIPCInitialize;
      ipcBridge.OnUpdateReceived += OnIPCUpdate;
      ipcBridge.OnRenderReceived += OnIPCRender;
      ipcBridge.OnCameraReceived += OnIPCCamera;
      ipcBridge.OnPostProcessingReceived += OnIPCPostProcessing;

      Debug.Log("✅ IPC callbacks registered");
    }

    #region Cathedral Generation

    /// <summary>
    /// Generate procedural cathedral
    /// </summary>
    public void GenerateCathedral()
    {
      if (cathedralRoot != null)
      {
        Destroy(cathedralRoot);
      }

      cathedralRoot = new GameObject("Cathedral");
      cathedralRoot.transform.SetParent(transform);

      float startTime = Time.realtimeSinceStartup;

      // Generate architectural components
      GenerateNave();
      GenerateTransept();
      GenerateApse();
      GenerateVaulting();
      GenerateRosettaWindow();
      GenerateFlyingButtresses();
      GenerateSpires();

      float generationTime = Time.realtimeSinceStartup - startTime;
      Debug.Log($"🌸 Cathedral generated in {generationTime:F2}s ({cathedralRoot.transform.childCount} objects)");
    }

    void GenerateNave()
    {
      GameObject nave = GameObject.CreatePrimitive(PrimitiveType.Cube);
      nave.name = "Nave";
      nave.transform.SetParent(cathedralRoot.transform);
      nave.transform.localScale = new Vector3(cathedralWidth, cathedralHeight, cathedralLength);
      nave.transform.localPosition = Vector3.zero;

      // Add material
      Material naveMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      naveMaterial.color = new Color(0.2f, 0.2f, 0.2f);
      naveMaterial.SetFloat("_Metallic", 0.3f);
      naveMaterial.SetFloat("_Smoothness", 0.7f);
      nave.GetComponent<Renderer>().material = naveMaterial;
    }

    void GenerateTransept()
    {
      GameObject transept = GameObject.CreatePrimitive(PrimitiveType.Cube);
      transept.name = "Transept";
      transept.transform.SetParent(cathedralRoot.transform);
      transept.transform.localScale = new Vector3(cathedralWidth * 1.5f, cathedralHeight * 0.8f, cathedralWidth);
      transept.transform.localPosition = new Vector3(0f, 0f, cathedralLength * 0.3f);

      Material transeptMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      transeptMaterial.color = new Color(0.25f, 0.25f, 0.25f);
      transept.GetComponent<Renderer>().material = transeptMaterial;
    }

    void GenerateApse()
    {
      GameObject apse = GameObject.CreatePrimitive(PrimitiveType.Sphere);
      apse.name = "Apse";
      apse.transform.SetParent(cathedralRoot.transform);
      apse.transform.localScale = new Vector3(cathedralWidth * 0.8f, cathedralHeight * 0.7f, cathedralWidth * 0.8f);
      apse.transform.localPosition = new Vector3(0f, 0f, cathedralLength * 0.5f + cathedralWidth * 0.4f);

      Material apseMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      apseMaterial.color = new Color(0.3f, 0.3f, 0.3f);
      apse.GetComponent<Renderer>().material = apseMaterial;
    }

    void GenerateVaulting()
    {
      for (int i = 0; i < archCount; i++)
      {
        float zPos = -cathedralLength * 0.4f + (cathedralLength * 0.8f / archCount) * i;

        // Left arch
        CreateArch(new Vector3(-cathedralWidth * 0.35f, cathedralHeight * 0.6f, zPos), Quaternion.Euler(0, 0, 45));

        // Right arch
        CreateArch(new Vector3(cathedralWidth * 0.35f, cathedralHeight * 0.6f, zPos), Quaternion.Euler(0, 0, -45));
      }
    }

    void CreateArch(Vector3 position, Quaternion rotation)
    {
      GameObject arch = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      arch.name = "Arch";
      arch.transform.SetParent(cathedralRoot.transform);
      arch.transform.localPosition = position;
      arch.transform.localRotation = rotation;
      arch.transform.localScale = new Vector3(1f, cathedralHeight * 0.3f, 1f);

      Material archMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      archMaterial.color = new Color(0.35f, 0.35f, 0.35f);
      arch.GetComponent<Renderer>().material = archMaterial;
    }

    void GenerateRosettaWindow()
    {
      GameObject rosetta = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      rosetta.name = "Rosetta Window";
      rosetta.transform.SetParent(cathedralRoot.transform);
      rosetta.transform.localScale = new Vector3(cathedralWidth * 0.4f, 0.2f, cathedralWidth * 0.4f);
      rosetta.transform.localPosition = new Vector3(0f, cathedralHeight * 0.7f, -cathedralLength * 0.5f - 0.1f);
      rosetta.transform.localRotation = Quaternion.Euler(90, 0, 0);

      Material rosettaMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      rosettaMaterial.color = style.primaryNeonColor;
      rosettaMaterial.EnableKeyword("_EMISSION");
      rosettaMaterial.SetColor("_EmissionColor", style.primaryNeonColor * 2f);
      rosetta.GetComponent<Renderer>().material = rosettaMaterial;
    }

    void GenerateFlyingButtresses()
    {
      for (int i = 0; i < archCount; i++)
      {
        float zPos = -cathedralLength * 0.4f + (cathedralLength * 0.8f / archCount) * i;

        CreateButtress(new Vector3(-cathedralWidth * 0.6f, cathedralHeight * 0.4f, zPos), false);
        CreateButtress(new Vector3(cathedralWidth * 0.6f, cathedralHeight * 0.4f, zPos), true);
      }
    }

    void CreateButtress(Vector3 position, bool flipDirection)
    {
      GameObject buttress = GameObject.CreatePrimitive(PrimitiveType.Cube);
      buttress.name = "Flying Buttress";
      buttress.transform.SetParent(cathedralRoot.transform);
      buttress.transform.localPosition = position;
      buttress.transform.localScale = new Vector3(cathedralWidth * 0.2f, cathedralHeight * 0.5f, 2f);

      Material buttressMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      buttressMaterial.color = new Color(0.3f, 0.3f, 0.3f);
      buttress.GetComponent<Renderer>().material = buttressMaterial;
    }

    void GenerateSpires()
    {
      // Main spire
      CreateSpire(new Vector3(0f, cathedralHeight * 1.3f, -cathedralLength * 0.5f), cathedralHeight * 0.8f);

      // Side spires
      CreateSpire(new Vector3(-cathedralWidth * 0.4f, cathedralHeight * 1.1f, -cathedralLength * 0.5f), cathedralHeight * 0.5f);
      CreateSpire(new Vector3(cathedralWidth * 0.4f, cathedralHeight * 1.1f, -cathedralLength * 0.5f), cathedralHeight * 0.5f);
    }

    void CreateSpire(Vector3 position, float height)
    {
      GameObject spire = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
      spire.name = "Spire";
      spire.transform.SetParent(cathedralRoot.transform);
      spire.transform.localPosition = position;
      spire.transform.localScale = new Vector3(2f, height, 2f);

      Material spireMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
      spireMaterial.color = new Color(0.4f, 0.4f, 0.4f);
      spire.GetComponent<Renderer>().material = spireMaterial;
    }

    #endregion

    #region Visual Effects

    /// <summary>
    /// Apply all visual effects
    /// </summary>
    void ApplyVisualEffects()
    {
      ApplyNeonEffects();
      ApplyVFXEffects();
      ApplyPostProcessing();
    }

    /// <summary>
    /// Apply neon lighting effects
    /// </summary>
    void ApplyNeonEffects()
    {
      // Clear existing lights
      foreach (Light light in neonLights)
      {
        if (light != null) Destroy(light.gameObject);
      }
      neonLights.Clear();

      // Create new neon lights
      for (int i = 0; i < archCount; i++)
      {
        float zPos = -cathedralLength * 0.4f + (cathedralLength * 0.8f / archCount) * i;

        CreateNeonLight(new Vector3(-cathedralWidth * 0.3f, cathedralHeight * 0.5f, zPos), style.primaryNeonColor);
        CreateNeonLight(new Vector3(cathedralWidth * 0.3f, cathedralHeight * 0.5f, zPos), style.secondaryNeonColor);
      }

      Debug.Log($"✨ Applied {neonLights.Count} neon lights");
    }

    void CreateNeonLight(Vector3 position, Color color)
    {
      GameObject lightObj = new GameObject("Neon Light");
      lightObj.transform.SetParent(cathedralRoot.transform);
      lightObj.transform.localPosition = position;

      Light light = lightObj.AddComponent<Light>();
      light.type = LightType.Point;
      light.color = color;
      light.intensity = 3f * style.neonIntensity;
      light.range = 15f;

      neonLights.Add(light);
    }

    /// <summary>
    /// Apply VFX Graph effects via controller
    /// </summary>
    void ApplyVFXEffects()
    {
      if (vfxController == null) return;

      vfxController.UpdatePinkIntensity(style.pinkIntensity);
      vfxController.UpdateNuclearIntensity(style.neonIntensity * 5f);

      Debug.Log("⚡ VFX effects applied");
    }

    /// <summary>
    /// Apply post-processing effects via controller
    /// </summary>
    void ApplyPostProcessing()
    {
      if (postProcessingController == null) return;

      // Apply pink cyber goth preset
      postProcessingController.SetBloomIntensity(3.0f * style.pinkIntensity);
      postProcessingController.SetChromaticIntensity(0.3f);
      postProcessingController.SetVignetteIntensity(0.4f);

      Debug.Log("🎨 Post-processing applied");
    }

    #endregion

    #region Update Loop

    private void Update()
    {
      // Animate neon lights
      if (style.neonFlickerSpeed > 0)
      {
        AnimateNeonLights();
      }
    }

    void AnimateNeonLights()
    {
      float flicker = Mathf.PerlinNoise(Time.time * style.neonFlickerSpeed, 0f);

      foreach (Light light in neonLights)
      {
        if (light != null)
        {
          light.intensity = (3f + flicker * 2f) * style.neonIntensity;
        }
      }
    }

    #endregion

    #region IPC Callbacks

    /// <summary>
    /// Handle initialize command from Node.js
    /// </summary>
    void OnIPCInitialize(string dataJson)
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

        // Update geometry parameters
        if (initData.cathedralWidth > 0)
          cathedralWidth = initData.cathedralWidth;

        if (initData.cathedralLength > 0)
          cathedralLength = initData.cathedralLength;

        if (initData.cathedralHeight > 0)
          cathedralHeight = initData.cathedralHeight;

        if (initData.archCount > 0)
          archCount = initData.archCount;

        // Regenerate cathedral
        GenerateCathedral();
        ApplyVisualEffects();

        Debug.Log($"🌸 Cathedral initialized: {initData.sceneName}");
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Initialize failed: {e.Message}");
      }
    }

    /// <summary>
    /// Handle update command from Node.js
    /// </summary>
    void OnIPCUpdate(string dataJson)
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
          ApplyVisualEffects();
          Debug.Log("🔄 Cathedral style updated");
        }
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Update failed: {e.Message}");
      }
    }

    /// <summary>
    /// Handle render command from Node.js
    /// </summary>
    void OnIPCRender(string dataJson)
    {
      try
      {
        var renderData = JsonUtility.FromJson<RenderData>(dataJson);
        StartCoroutine(CaptureScreenshot(renderData));
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Render failed: {e.Message}");
      }
    }

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
        System.IO.File.WriteAllBytes(renderData.outputPath, bytes);

        float renderTime = Time.realtimeSinceStartup - startTime;

        Debug.Log($"📸 Screenshot saved: {renderData.outputPath} ({renderTime:F2}s)");

        Destroy(screenshot);
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Screenshot capture failed: {e.Message}");
      }
    }

    /// <summary>
    /// Handle camera command from Node.js
    /// </summary>
    void OnIPCCamera(string dataJson)
    {
      if (cinemachineController == null)
      {
        Debug.LogWarning("⚠️ CinemachineController not found");
        return;
      }

      try
      {
        var cameraData = JsonUtility.FromJson<CameraData>(dataJson);

        if (cameraData.view != null)
        {
          switch (cameraData.view.ToLower())
          {
            case "nave":
              cinemachineController.SwitchToNaveView();
              break;
            case "altar":
              cinemachineController.SwitchToAltarView();
              break;
            case "roof":
              cinemachineController.SwitchToRoofView();
              break;
            case "flyby":
              cinemachineController.StartFlyby();
              break;
          }
        }

        if (cameraData.fieldOfView > 0)
        {
          cinemachineController.SetFieldOfView(cameraData.fieldOfView);
        }

        Debug.Log($"🎥 Camera updated: {cameraData.view}");
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Camera update failed: {e.Message}");
      }
    }

    /// <summary>
    /// Handle post-processing command from Node.js
    /// </summary>
    void OnIPCPostProcessing(string dataJson)
    {
      if (postProcessingController == null)
      {
        Debug.LogWarning("⚠️ PostProcessingController not found");
        return;
      }

      try
      {
        var ppData = JsonUtility.FromJson<PostProcessingData>(dataJson);

        postProcessingController.UpdatePostProcessing(
            ppData.bloom >= 0 ? ppData.bloom : 3.0f,
            ppData.chromaticAberration >= 0 ? ppData.chromaticAberration : 0.3f,
            ppData.vignette >= 0 ? ppData.vignette : 0.4f
        );

        Debug.Log("🎨 Post-processing updated via IPC");
      }
      catch (Exception e)
      {
        Debug.LogError($"❌ Post-processing update failed: {e.Message}");
      }
    }

    #endregion

    #region Data Classes

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
      public string view;
      public float fieldOfView;
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
    class PostProcessingData
    {
      public float bloom = -1f;
      public float chromaticAberration = -1f;
      public float vignette = -1f;
    }

    #endregion
  }

  /// <summary>
  /// Cathedral style configuration
  /// </summary>
  [System.Serializable]
  public class CathedralStyle
  {
    [Header("🌸 Neon Cyber Goth Configuration")]
    [Range(0f, 1f)] public float pinkIntensity = 0.8f;
    [Range(0, 1000)] public int eldritchLevel = 666;
    [Range(0f, 5f)] public float neonIntensity = 2.5f;

    [Header("🎨 Color Configuration")]
    public Color primaryNeonColor = new Color(1f, 0f, 0.5f, 1f); // Hot pink
    public Color secondaryNeonColor = new Color(0f, 1f, 0.5f, 1f); // Nuclear green

    [Header("⚡ Animation Configuration")]
    [Range(0f, 10f)] public float neonFlickerSpeed = 2f;
    [Range(0f, 10f)] public float nuclearPulseSpeed = 1.5f;
  }
}
