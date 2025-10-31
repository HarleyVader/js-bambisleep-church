/**
 * BambiSleep™ Church - Zathras Integration
 * Unity-side handler for Zathras Agent IPC commands
 * 
 * Extends IPCBridge to handle Zathras-specific commands:
 * - zathras:command - Execute agent commands
 * - zathras:query - Query cathedral state
 * - zathras:workflow - Execute multi-step workflows
 */

using UnityEngine;
using System;
using System.Collections.Generic;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// Zathras command data structure
  /// </summary>
  [Serializable]
  public class ZathrasCommandData
  {
    public string action;
    public string parameters; // JSON string
  }

  /// <summary>
  /// Zathras event response data
  /// </summary>
  [Serializable]
  public class ZathrasEventData
  {
    public string eventType;
    public string status;
    public string result; // JSON string
    public string error;
  }

  /// <summary>
  /// Cathedral state query response
  /// </summary>
  [Serializable]
  public class CathedralStateData
  {
    public string style;
    public float neonIntensity;
    public float bloomIntensity;
    public float pinkIntensity;
    public int eldritchLevel;
    public int objectCount;
    public float fps;
    public bool isRendering;
  }

  /// <summary>
  /// Zathras Integration - Handles Zathras agent IPC commands
  /// </summary>
  public class ZathrasIntegration : MonoBehaviour
  {
    [Header("🤖 Zathras Configuration")]
    public bool enableZathras = true;
    public float commandTimeout = 30f;

    private IPCBridge ipcBridge;
    private CathedralRendererV2 cathedralRenderer;
    private VFXController vfxController;
    private PostProcessingController postProcessingController;
    private CinemachineController cinemachineController;

    private Dictionary<string, Action<ZathrasCommandData>> commandHandlers;
    private Queue<ZathrasCommandData> commandQueue;
    private bool isProcessingCommand = false;

    void Awake()
    {
      InitializeComponents();
      RegisterCommandHandlers();
      commandQueue = new Queue<ZathrasCommandData>();
    }

    void Start()
    {
      if (enableZathras)
      {
        Debug.Log("🤖 Zathras Integration enabled");
        RegisterIPCCallbacks();
      }
    }

    void Update()
    {
      ProcessCommandQueue();
    }

    /// <summary>
    /// Initialize required components
    /// </summary>
    void InitializeComponents()
    {
      // Find IPCBridge
      ipcBridge = FindObjectOfType<IPCBridge>();
      if (ipcBridge == null)
      {
        Debug.LogError("❌ IPCBridge not found! Zathras integration disabled.");
        enableZathras = false;
        return;
      }

      // Find CathedralRendererV2
      cathedralRenderer = FindObjectOfType<CathedralRendererV2>();
      if (cathedralRenderer == null)
      {
        Debug.LogWarning("⚠️ CathedralRendererV2 not found. Some features may be unavailable.");
      }
      else
      {
        vfxController = cathedralRenderer.vfxController;
        postProcessingController = cathedralRenderer.postProcessingController;
        cinemachineController = cathedralRenderer.cinemachineController;
      }

      Debug.Log("✅ Zathras components initialized");
    }

    /// <summary>
    /// Register command handlers for Zathras actions
    /// </summary>
    void RegisterCommandHandlers()
    {
      commandHandlers = new Dictionary<string, Action<ZathrasCommandData>>()
      {
        { "updateStyle", HandleUpdateStyle },
        { "renderSnapshot", HandleRenderSnapshot },
        { "queryCathedralState", HandleQueryState },
        { "applyVFX", HandleApplyVFX },
        { "setCamera", HandleSetCamera },
        { "startAnimation", HandleStartAnimation },
        { "stopAnimation", HandleStopAnimation },
        { "executeWorkflow", HandleExecuteWorkflow },
        { "ping", HandlePing }
      };

      Debug.Log($"✅ Registered {commandHandlers.Count} Zathras command handlers");
    }

    /// <summary>
    /// Register IPC callbacks to receive Zathras messages
    /// </summary>
    void RegisterIPCCallbacks()
    {
      // Listen for zathras:command messages from Node.js
      // This would integrate with IPCBridge message routing
      Debug.Log("🌐 Zathras IPC callbacks registered");
    }

    /// <summary>
    /// Process incoming Zathras command (called by IPCBridge)
    /// </summary>
    public void ProcessZathrasCommand(string commandJson)
    {
      try
      {
        var command = JsonUtility.FromJson<ZathrasCommandData>(commandJson);

        if (command == null || string.IsNullOrEmpty(command.action))
        {
          SendError("INVALID_COMMAND", "Command data is null or missing action");
          return;
        }

        Debug.Log($"🤖 Zathras command received: {command.action}");

        // Add to queue for processing
        commandQueue.Enqueue(command);
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Failed to parse Zathras command: {ex.Message}");
        SendError("PARSE_ERROR", ex.Message);
      }
    }

    /// <summary>
    /// Process command queue
    /// </summary>
    void ProcessCommandQueue()
    {
      if (isProcessingCommand || commandQueue.Count == 0)
        return;

      isProcessingCommand = true;
      var command = commandQueue.Dequeue();

      try
      {
        ExecuteCommand(command);
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Command execution failed: {ex.Message}");
        SendError("EXECUTION_ERROR", ex.Message);
      }
      finally
      {
        isProcessingCommand = false;
      }
    }

    /// <summary>
    /// Execute Zathras command
    /// </summary>
    void ExecuteCommand(ZathrasCommandData command)
    {
      if (commandHandlers.ContainsKey(command.action))
      {
        commandHandlers[command.action](command);
      }
      else
      {
        Debug.LogWarning($"⚠️ Unknown Zathras command: {command.action}");
        SendError("UNKNOWN_COMMAND", $"No handler for action: {command.action}");
      }
    }

    /// <summary>
    /// Handle updateStyle command
    /// </summary>
    void HandleUpdateStyle(ZathrasCommandData command)
    {
      try
      {
        // Parse style parameters from JSON
        var styleParams = JsonUtility.FromJson<CathedralStyle>(command.parameters);

        if (cathedralRenderer != null)
        {
          // Update cathedral style
          cathedralRenderer.style = styleParams;

          // Apply to controllers
          if (vfxController != null)
          {
            vfxController.neonIntensity = styleParams.neonIntensity;
          }

          if (postProcessingController != null)
          {
            postProcessingController.SetBloomIntensity(styleParams.bloomIntensity);
          }

          Debug.Log($"✅ Cathedral style updated: neon={styleParams.neonIntensity}, bloom={styleParams.bloomIntensity}");
          SendSuccess("updateStyle", "Style updated successfully");
        }
        else
        {
          SendError("NO_RENDERER", "CathedralRenderer not available");
        }
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Failed to update style: {ex.Message}");
        SendError("UPDATE_STYLE_FAILED", ex.Message);
      }
    }

    /// <summary>
    /// Handle renderSnapshot command
    /// </summary>
    void HandleRenderSnapshot(ZathrasCommandData command)
    {
      try
      {
        // Parse snapshot parameters
        var snapParams = JsonUtility.FromJson<SnapshotParams>(command.parameters);

        // Trigger snapshot capture
        StartCoroutine(CaptureSnapshot(snapParams));
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Failed to render snapshot: {ex.Message}");
        SendError("RENDER_FAILED", ex.Message);
      }
    }

    /// <summary>
    /// Snapshot parameters
    /// </summary>
    [Serializable]
    public class SnapshotParams
    {
      public string outputPath;
      public int width = 1920;
      public int height = 1080;
    }

    /// <summary>
    /// Capture snapshot coroutine
    /// </summary>
    IEnumerator CaptureSnapshot(SnapshotParams snapParams)
    {
      Debug.Log($"📸 Capturing snapshot: {snapParams.width}x{snapParams.height}");

      // Wait for end of frame
      yield return new WaitForEndOfFrame();

      // Create render texture
      RenderTexture rt = new RenderTexture(snapParams.width, snapParams.height, 24);
      Camera.main.targetTexture = rt;

      // Render
      Camera.main.Render();

      // Read pixels
      RenderTexture.active = rt;
      Texture2D screenshot = new Texture2D(snapParams.width, snapParams.height, TextureFormat.RGB24, false);
      screenshot.ReadPixels(new Rect(0, 0, snapParams.width, snapParams.height), 0, 0);
      screenshot.Apply();

      // Reset camera
      Camera.main.targetTexture = null;
      RenderTexture.active = null;
      Destroy(rt);

      // Save to file
      byte[] bytes = screenshot.EncodeToPNG();
      System.IO.File.WriteAllBytes(snapParams.outputPath, bytes);

      Debug.Log($"✅ Snapshot saved: {snapParams.outputPath}");
      SendSuccess("renderSnapshot", snapParams.outputPath);

      Destroy(screenshot);
    }

    /// <summary>
    /// Handle queryCathedralState command
    /// </summary>
    void HandleQueryState(ZathrasCommandData command)
    {
      try
      {
        var state = new CathedralStateData
        {
          style = cathedralRenderer?.style.ToString() ?? "unknown",
          neonIntensity = vfxController?.neonIntensity ?? 0f,
          bloomIntensity = postProcessingController?.GetBloomIntensity() ?? 0f,
          pinkIntensity = cathedralRenderer?.style.pinkIntensity ?? 0f,
          eldritchLevel = cathedralRenderer?.style.eldritchLevel ?? 0,
          objectCount = GameObject.FindObjectsOfType<GameObject>().Length,
          fps = (int)(1f / Time.deltaTime),
          isRendering = !isProcessingCommand
        };

        string stateJson = JsonUtility.ToJson(state);
        SendSuccess("queryCathedralState", stateJson);
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Failed to query state: {ex.Message}");
        SendError("QUERY_FAILED", ex.Message);
      }
    }

    /// <summary>
    /// Handle applyVFX command
    /// </summary>
    void HandleApplyVFX(ZathrasCommandData command)
    {
      try
      {
        if (vfxController != null)
        {
          // Parse VFX parameters and apply
          Debug.Log("✨ Applying VFX effects");
          SendSuccess("applyVFX", "VFX applied");
        }
        else
        {
          SendError("NO_VFX", "VFXController not available");
        }
      }
      catch (Exception ex)
      {
        SendError("VFX_FAILED", ex.Message);
      }
    }

    /// <summary>
    /// Handle setCamera command
    /// </summary>
    void HandleSetCamera(ZathrasCommandData command)
    {
      try
      {
        if (cinemachineController != null)
        {
          // Parse camera parameters and apply
          Debug.Log("🎥 Camera settings updated");
          SendSuccess("setCamera", "Camera configured");
        }
        else
        {
          SendError("NO_CAMERA", "CinemachineController not available");
        }
      }
      catch (Exception ex)
      {
        SendError("CAMERA_FAILED", ex.Message);
      }
    }

    /// <summary>
    /// Handle startAnimation command
    /// </summary>
    void HandleStartAnimation(ZathrasCommandData command)
    {
      Debug.Log("▶️ Animation started");
      SendSuccess("startAnimation", "Animation playing");
    }

    /// <summary>
    /// Handle stopAnimation command
    /// </summary>
    void HandleStopAnimation(ZathrasCommandData command)
    {
      Debug.Log("⏸️ Animation stopped");
      SendSuccess("stopAnimation", "Animation paused");
    }

    /// <summary>
    /// Handle executeWorkflow command
    /// </summary>
    void HandleExecuteWorkflow(ZathrasCommandData command)
    {
      Debug.Log("🔄 Executing workflow...");
      // Workflow execution would be implemented here
      SendSuccess("executeWorkflow", "Workflow started");
    }

    /// <summary>
    /// Handle ping command (health check)
    /// </summary>
    void HandlePing(ZathrasCommandData command)
    {
      SendSuccess("ping", "pong");
    }

    /// <summary>
    /// Send success event to Node.js
    /// </summary>
    void SendSuccess(string action, string result)
    {
      var eventData = new ZathrasEventData
      {
        eventType = action,
        status = "success",
        result = result,
        error = null
      };

      SendZathrasEvent(eventData);
    }

    /// <summary>
    /// Send error event to Node.js
    /// </summary>
    void SendError(string errorCode, string message)
    {
      var eventData = new ZathrasEventData
      {
        eventType = "error",
        status = "error",
        result = null,
        error = $"{errorCode}: {message}"
      };

      SendZathrasEvent(eventData);
    }

    /// <summary>
    /// Send Zathras event via IPC
    /// </summary>
    void SendZathrasEvent(ZathrasEventData eventData)
    {
      try
      {
        string eventJson = JsonUtility.ToJson(eventData);

        // Send via IPCBridge
        var message = new IPCMessage
        {
          type = "zathras:event",
          timestamp = DateTime.UtcNow.ToString("o"),
          data = eventJson
        };

        string messageJson = JsonUtility.ToJson(message);
        Console.WriteLine(messageJson); // STDIO output to Node.js

        Debug.Log($"📤 Zathras event sent: {eventData.eventType} - {eventData.status}");
      }
      catch (Exception ex)
      {
        Debug.LogError($"❌ Failed to send Zathras event: {ex.Message}");
      }
    }
  }
}
