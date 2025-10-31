/**
 * BambiSleep™ Church - Post-Processing Controller
 * Manages URP post-processing effects (bloom, chromatic aberration, vignette)
 * Uses Post-Processing Stack v2 with dynamic control
 */

using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// Post-Processing Controller for bloom, chromatic aberration, and vignette
  /// </summary>
  public class PostProcessingController : MonoBehaviour
  {
    [Header("📦 Volume Configuration")]
    public Volume globalVolume;

    [Header("🌸 Bloom Settings")]
    [Range(0f, 10f)] public float bloomIntensity = 3.0f;
    [Range(0f, 1f)] public float bloomThreshold = 0.9f;
    [Range(0f, 1f)] public float bloomScatter = 0.7f;

    [Header("🌈 Chromatic Aberration Settings")]
    [Range(0f, 1f)] public float chromaticIntensity = 0.3f;

    [Header("🖤 Vignette Settings")]
    [Range(0f, 1f)] public float vignetteIntensity = 0.4f;
    [Range(0f, 1f)] public float vignetteSmoothness = 0.4f;
    public Color vignetteColor = Color.black;

    // Post-processing effect references
    private Bloom bloom;
    private ChromaticAberration chromaticAberration;
    private Vignette vignette;

    private void Awake()
    {
      InitializeVolume();
    }

    private void Start()
    {
      ApplyDefaultSettings();
    }

    /// <summary>
    /// Initialize post-processing volume and effects
    /// </summary>
    void InitializeVolume()
    {
      if (globalVolume == null)
      {
        // Try to find existing volume
        globalVolume = FindObjectOfType<Volume>();

        if (globalVolume == null)
        {
          // Create new volume
          GameObject volumeObj = new GameObject("Global Volume");
          volumeObj.transform.SetParent(transform);
          globalVolume = volumeObj.AddComponent<Volume>();
          globalVolume.isGlobal = true;
          globalVolume.priority = 1;

          // Create profile
          globalVolume.profile = ScriptableObject.CreateInstance<VolumeProfile>();

          Debug.Log("✅ Created new global post-processing volume");
        }
      }

      // Get or add post-processing effects
      if (!globalVolume.profile.TryGet(out bloom))
      {
        bloom = globalVolume.profile.Add<Bloom>(true);
        Debug.Log("✨ Added Bloom effect");
      }

      if (!globalVolume.profile.TryGet(out chromaticAberration))
      {
        chromaticAberration = globalVolume.profile.Add<ChromaticAberration>(true);
        Debug.Log("🌈 Added Chromatic Aberration effect");
      }

      if (!globalVolume.profile.TryGet(out vignette))
      {
        vignette = globalVolume.profile.Add<Vignette>(true);
        Debug.Log("🖤 Added Vignette effect");
      }
    }

    /// <summary>
    /// Apply default post-processing settings
    /// </summary>
    public void ApplyDefaultSettings()
    {
      if (bloom == null || chromaticAberration == null || vignette == null)
      {
        Debug.LogError("❌ Post-processing effects not initialized");
        return;
      }

      // Bloom configuration
      bloom.intensity.value = bloomIntensity;
      bloom.threshold.value = bloomThreshold;
      bloom.scatter.value = bloomScatter;
      bloom.active = true;

      // Chromatic aberration configuration
      chromaticAberration.intensity.value = chromaticIntensity;
      chromaticAberration.active = true;

      // Vignette configuration
      vignette.intensity.value = vignetteIntensity;
      vignette.smoothness.value = vignetteSmoothness;
      vignette.color.value = vignetteColor;
      vignette.active = true;

      Debug.Log("✅ Applied default post-processing settings");
    }

    /// <summary>
    /// Update bloom intensity (IPC integration)
    /// </summary>
    public void SetBloomIntensity(float intensity)
    {
      if (bloom == null) return;

      bloomIntensity = Mathf.Clamp(intensity, 0f, 10f);
      bloom.intensity.value = bloomIntensity;

      Debug.Log($"✨ Bloom intensity: {bloomIntensity:F2}");
    }

    /// <summary>
    /// Update chromatic aberration intensity (IPC integration)
    /// </summary>
    public void SetChromaticIntensity(float intensity)
    {
      if (chromaticAberration == null) return;

      chromaticIntensity = Mathf.Clamp01(intensity);
      chromaticAberration.intensity.value = chromaticIntensity;

      Debug.Log($"🌈 Chromatic aberration intensity: {chromaticIntensity:F2}");
    }

    /// <summary>
    /// Update vignette intensity (IPC integration)
    /// </summary>
    public void SetVignetteIntensity(float intensity)
    {
      if (vignette == null) return;

      vignetteIntensity = Mathf.Clamp01(intensity);
      vignette.intensity.value = vignetteIntensity;

      Debug.Log($"🖤 Vignette intensity: {vignetteIntensity:F2}");
    }

    /// <summary>
    /// Update all post-processing effects at once (IPC integration)
    /// </summary>
    public void UpdatePostProcessing(float bloomValue, float chromaticValue, float vignetteValue)
    {
      SetBloomIntensity(bloomValue);
      SetChromaticIntensity(chromaticValue);
      SetVignetteIntensity(vignetteValue);

      Debug.Log($"🎨 Updated post-processing: Bloom={bloomValue:F2}, Chromatic={chromaticValue:F2}, Vignette={vignetteValue:F2}");
    }

    /// <summary>
    /// Enable/disable all post-processing effects
    /// </summary>
    public void SetPostProcessingActive(bool active)
    {
      if (bloom != null) bloom.active = active;
      if (chromaticAberration != null) chromaticAberration.active = active;
      if (vignette != null) vignette.active = active;

      Debug.Log($"🎨 Post-processing {(active ? "enabled" : "disabled")}");
    }

    /// <summary>
    /// Reset post-processing to default values
    /// </summary>
    public void ResetPostProcessing()
    {
      bloomIntensity = 3.0f;
      chromaticIntensity = 0.3f;
      vignetteIntensity = 0.4f;

      ApplyDefaultSettings();

      Debug.Log("🔄 Post-processing reset to default");
    }

    /// <summary>
    /// Apply pink cyber goth preset
    /// </summary>
    public void ApplyPinkCyberGothPreset()
    {
      SetBloomIntensity(5.0f);
      SetChromaticIntensity(0.5f);
      SetVignetteIntensity(0.6f);

      Debug.Log("🌸 Applied Pink Cyber Goth preset");
    }

    /// <summary>
    /// Apply nuclear glow preset
    /// </summary>
    public void ApplyNuclearGlowPreset()
    {
      SetBloomIntensity(8.0f);
      SetChromaticIntensity(0.7f);
      SetVignetteIntensity(0.3f);

      Debug.Log("⚡ Applied Nuclear Glow preset");
    }
  }
}
