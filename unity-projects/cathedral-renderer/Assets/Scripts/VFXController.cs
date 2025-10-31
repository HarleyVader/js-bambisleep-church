/**
 * BambiSleep™ Church - VFX Graph Controller
 * GPU-accelerated particle systems for nuclear glow and neon sparkles
 * Uses Unity VFX Graph instead of legacy ParticleSystem
 */

using UnityEngine;
using UnityEngine.VFX;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// VFX Graph Controller for pink sparkles and nuclear glow effects
  /// </summary>
  public class VFXController : MonoBehaviour
  {
    [Header("🌸 Pink Sparkle Configuration")]
    public VisualEffect pinkSparkleEffect;
    public float baseSpawnRate = 100.0f;
    public Color pinkColor = new Color(1.0f, 0.5f, 0.9f);

    [Header("⚡ Nuclear Glow Configuration")]
    public VisualEffect nuclearGlowEffect;
    public float glowSpawnRate = 50.0f;
    public Color nuclearColor = new Color(0f, 1f, 0.5f, 1f);

    [Header("🦋 Butterfly Flight Configuration")]
    public VisualEffect butterflyEffect;
    public int butterflyCount = 20;

    private void Start()
    {
      InitializePinkSparkles();
      InitializeNuclearGlow();
      InitializeButterflyFlight();
    }

    /// <summary>
    /// Initialize pink sparkle VFX
    /// </summary>
    void InitializePinkSparkles()
    {
      if (pinkSparkleEffect == null)
      {
        Debug.LogWarning("⚠️ PinkSparkleEffect not assigned");
        return;
      }

      // Configure VFX Graph properties
      pinkSparkleEffect.SetFloat("SpawnRate", baseSpawnRate);
      pinkSparkleEffect.SetVector4("TintColor", pinkColor);
      pinkSparkleEffect.SetFloat("Lifetime", 2.0f);
      pinkSparkleEffect.SetFloat("Size", 0.5f);

      Debug.Log("✨ Pink sparkle VFX initialized");
    }

    /// <summary>
    /// Initialize nuclear glow VFX
    /// </summary>
    void InitializeNuclearGlow()
    {
      if (nuclearGlowEffect == null)
      {
        Debug.LogWarning("⚠️ NuclearGlowEffect not assigned");
        return;
      }

      // Configure VFX Graph properties
      nuclearGlowEffect.SetFloat("SpawnRate", glowSpawnRate);
      nuclearGlowEffect.SetVector4("TintColor", nuclearColor);
      nuclearGlowEffect.SetFloat("Lifetime", 3.0f);
      nuclearGlowEffect.SetFloat("Intensity", 5.0f);

      Debug.Log("⚡ Nuclear glow VFX initialized");
    }

    /// <summary>
    /// Initialize butterfly flight VFX (secret cow powers reference)
    /// </summary>
    void InitializeButterflyFlight()
    {
      if (butterflyEffect == null)
      {
        Debug.LogWarning("⚠️ ButterflyEffect not assigned");
        return;
      }

      // Configure VFX Graph properties
      butterflyEffect.SetInt("ButterflyCount", butterflyCount);
      butterflyEffect.SetFloat("FlightSpeed", 5.0f);
      butterflyEffect.SetFloat("FlutterIntensity", 2.0f);

      Debug.Log("🦋 Butterfly flight VFX initialized (secret cow power activated!)");
    }

    /// <summary>
    /// Trigger cow power explosion burst effect
    /// </summary>
    public void TriggerCowPowerExplosion()
    {
      if (pinkSparkleEffect != null)
      {
        // Burst event for dramatic effect
        pinkSparkleEffect.SendEvent("OnCowPowerActivated");

        // Temporarily increase spawn rate
        StartCoroutine(SpawnRateBurst());
      }
    }

    /// <summary>
    /// Spawn rate burst coroutine
    /// </summary>
    System.Collections.IEnumerator SpawnRateBurst()
    {
      float originalRate = baseSpawnRate;
      pinkSparkleEffect.SetFloat("SpawnRate", originalRate * 10.0f);

      yield return new WaitForSeconds(2.0f);

      pinkSparkleEffect.SetFloat("SpawnRate", originalRate);
    }

    /// <summary>
    /// Update pink intensity dynamically (IPC integration)
    /// </summary>
    public void UpdatePinkIntensity(float intensity)
    {
      if (pinkSparkleEffect == null) return;

      Color adjustedColor = Color.Lerp(Color.white, pinkColor, intensity);
      pinkSparkleEffect.SetVector4("TintColor", adjustedColor);

      Debug.Log($"🌸 Pink intensity updated: {intensity:F2}");
    }

    /// <summary>
    /// Update nuclear glow intensity
    /// </summary>
    public void UpdateNuclearIntensity(float intensity)
    {
      if (nuclearGlowEffect == null) return;

      nuclearGlowEffect.SetFloat("Intensity", intensity);
      Debug.Log($"⚡ Nuclear intensity updated: {intensity:F2}");
    }

    /// <summary>
    /// Enable/disable all VFX systems
    /// </summary>
    public void SetVFXActive(bool active)
    {
      if (pinkSparkleEffect != null)
        pinkSparkleEffect.enabled = active;

      if (nuclearGlowEffect != null)
        nuclearGlowEffect.enabled = active;

      if (butterflyEffect != null)
        butterflyEffect.enabled = active;

      Debug.Log($"🎨 VFX systems {(active ? "enabled" : "disabled")}");
    }

    /// <summary>
    /// Reset all VFX to default state
    /// </summary>
    public void ResetVFX()
    {
      InitializePinkSparkles();
      InitializeNuclearGlow();
      InitializeButterflyFlight();

      Debug.Log("🔄 VFX systems reset to default");
    }
  }
}
