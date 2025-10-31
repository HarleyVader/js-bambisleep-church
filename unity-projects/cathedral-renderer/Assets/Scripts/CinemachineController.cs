/**
 * BambiSleep™ Church - Cinemachine Controller
 * Manages virtual cameras for cinematic cathedral views
 * Supports dynamic camera switching and smooth transitions
 */

using UnityEngine;
using Unity.Cinemachine;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// Cinemachine Controller for dynamic camera management
  /// </summary>
  public class CinemachineController : MonoBehaviour
  {
    [Header("🎥 Camera Configuration")]
    public CinemachineCamera[] virtualCameras;
    public int activeCameraIndex = 0;

    [Header("🎬 Predefined Views")]
    public CinemachineCamera naveViewCamera;
    public CinemachineCamera altarViewCamera;
    public CinemachineCamera roofViewCamera;
    public CinemachineCamera flybyCamera;

    [Header("⚙️ Transition Settings")]
    public float transitionBlendTime = 2.0f;

    private CinemachineCamera currentCamera;

    private void Start()
    {
      InitializeCameras();
    }

    /// <summary>
    /// Initialize all virtual cameras
    /// </summary>
    void InitializeCameras()
    {
      if (virtualCameras == null || virtualCameras.Length == 0)
      {
        // Auto-discover cameras
        virtualCameras = GetComponentsInChildren<CinemachineCamera>();
        Debug.Log($"🎥 Found {virtualCameras.Length} virtual cameras");
      }

      if (virtualCameras.Length > 0)
      {
        ActivateCamera(activeCameraIndex);
      }
      else
      {
        Debug.LogWarning("⚠️ No virtual cameras found");
      }
    }

    /// <summary>
    /// Activate camera by index
    /// </summary>
    public void ActivateCamera(int index)
    {
      if (virtualCameras == null || index < 0 || index >= virtualCameras.Length)
      {
        Debug.LogError($"❌ Invalid camera index: {index}");
        return;
      }

      // Deactivate all cameras
      for (int i = 0; i < virtualCameras.Length; i++)
      {
        virtualCameras[i].Priority = (i == index) ? 100 : 0;
      }

      currentCamera = virtualCameras[index];
      activeCameraIndex = index;

      Debug.Log($"🎥 Activated camera {index}: {currentCamera.name}");
    }

    /// <summary>
    /// Switch to next camera in sequence
    /// </summary>
    public void NextCamera()
    {
      int nextIndex = (activeCameraIndex + 1) % virtualCameras.Length;
      ActivateCamera(nextIndex);
    }

    /// <summary>
    /// Switch to previous camera in sequence
    /// </summary>
    public void PreviousCamera()
    {
      int prevIndex = (activeCameraIndex - 1 + virtualCameras.Length) % virtualCameras.Length;
      ActivateCamera(prevIndex);
    }

    /// <summary>
    /// Switch to nave view (IPC integration)
    /// </summary>
    public void SwitchToNaveView()
    {
      if (naveViewCamera != null)
      {
        SetCameraActive(naveViewCamera);
        Debug.Log("🎥 Switched to Nave View");
      }
    }

    /// <summary>
    /// Switch to altar view (IPC integration)
    /// </summary>
    public void SwitchToAltarView()
    {
      if (altarViewCamera != null)
      {
        SetCameraActive(altarViewCamera);
        Debug.Log("🎥 Switched to Altar View");
      }
    }

    /// <summary>
    /// Switch to roof view (IPC integration)
    /// </summary>
    public void SwitchToRoofView()
    {
      if (roofViewCamera != null)
      {
        SetCameraActive(roofViewCamera);
        Debug.Log("🎥 Switched to Roof View");
      }
    }

    /// <summary>
    /// Activate flyby camera for cinematic movement (IPC integration)
    /// </summary>
    public void StartFlyby()
    {
      if (flybyCamera != null)
      {
        SetCameraActive(flybyCamera);
        Debug.Log("🎥 Started Flyby Camera");
      }
    }

    /// <summary>
    /// Helper method to activate specific camera
    /// </summary>
    private void SetCameraActive(CinemachineCamera camera)
    {
      // Deactivate all cameras
      if (virtualCameras != null)
      {
        foreach (var cam in virtualCameras)
        {
          cam.Priority = 0;
        }
      }

      // Activate specified camera
      camera.Priority = 100;
      currentCamera = camera;
    }

    /// <summary>
    /// Set camera field of view (IPC integration)
    /// </summary>
    public void SetFieldOfView(float fov)
    {
      if (currentCamera == null) return;

      var lens = currentCamera.Lens;
      lens.FieldOfView = Mathf.Clamp(fov, 10f, 120f);
      currentCamera.Lens = lens;

      Debug.Log($"🎥 Camera FOV set to {fov:F1}");
    }

    /// <summary>
    /// Set camera damping for smooth follow
    /// </summary>
    public void SetCameraDamping(float damping)
    {
      if (currentCamera == null) return;

      // Get or add position composer
      var composer = currentCamera.GetComponent<CinemachinePositionComposer>();
      if (composer != null)
      {
        composer.Damping = new Vector3(damping, damping, damping);
        Debug.Log($"🎥 Camera damping set to {damping:F2}");
      }
    }

    /// <summary>
    /// Update camera target (IPC integration)
    /// </summary>
    public void SetCameraTarget(Transform target)
    {
      if (currentCamera == null || target == null) return;

      currentCamera.Follow = target;
      currentCamera.LookAt = target;

      Debug.Log($"🎥 Camera target set to {target.name}");
    }

    /// <summary>
    /// Reset camera to default position
    /// </summary>
    public void ResetCamera()
    {
      if (virtualCameras != null && virtualCameras.Length > 0)
      {
        ActivateCamera(0);
      }

      Debug.Log("🔄 Camera reset to default");
    }

    /// <summary>
    /// Get current camera name (IPC integration)
    /// </summary>
    public string GetCurrentCameraName()
    {
      return currentCamera != null ? currentCamera.name : "None";
    }

    /// <summary>
    /// Enable/disable camera shake effect
    /// </summary>
    public void SetCameraShake(bool enabled, float intensity = 1.0f)
    {
      if (currentCamera == null) return;

      var noise = currentCamera.GetComponent<CinemachineBasicMultiChannelPerlin>();
      if (noise != null)
      {
        noise.AmplitudeGain = enabled ? intensity : 0f;
        Debug.Log($"🎥 Camera shake {(enabled ? "enabled" : "disabled")} (intensity: {intensity:F2})");
      }
    }
  }
}
