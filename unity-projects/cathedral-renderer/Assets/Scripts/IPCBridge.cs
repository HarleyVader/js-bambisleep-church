/**
 * BambiSleep™ Church - Unity IPC Bridge
 * Bidirectional JSON communication with Node.js via stdin/stdout
 * Protocol Version: 1.0.0
 * 
 * Message Flow:
 * Node→Unity: initialize, update, render, camera, postprocessing, setPaused, shutdown
 * Unity→Node: scene-loaded, update-ack, render-complete, camera-changed, error, heartbeat
 */

using UnityEngine;
using System;
using System.Collections;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// IPC Message structure for JSON serialization
  /// </summary>
  [Serializable]
  public class IPCMessage
  {
    public string type;
    public string timestamp;
    public string data; // JSON string for nested object
  }

  /// <summary>
  /// Initialize command data
  /// </summary>
  [Serializable]
  public class InitializeData
  {
    public string sceneName = "BambiSleepCathedral";
    public float pinkIntensity = 0.8f;
    public int eldritchLevel = 666;
    public float neonIntensity = 10f;
    public int archCount = 12;
  }

  /// <summary>
  /// Scene loaded response data
  /// </summary>
  [Serializable]
  public class SceneLoadedData
  {
    public string sceneName;
    public int objectCount;
    public float renderTime;
  }

  /// <summary>
  /// Update acknowledgment data
  /// </summary>
  [Serializable]
  public class UpdateAckData
  {
    public bool success;
    public string message;
  }

  /// <summary>
  /// Error response data
  /// </summary>
  [Serializable]
  public class ErrorData
  {
    public string errorCode;
    public string message;
    public string stackTrace;
  }

  /// <summary>
  /// Heartbeat data
  /// </summary>
  [Serializable]
  public class HeartbeatData
  {
    public float uptime;
    public int fps;
    public string state;
  }

  /// <summary>
  /// IPC Bridge - Handles all communication between Node.js and Unity
  /// </summary>
  public class IPCBridge : MonoBehaviour
  {
    [Header("🌐 IPC Configuration")]
    public bool enableIPC = true;
    public float heartbeatInterval = 5f;

    private CathedralRenderer cathedralRenderer;
    private MCPToolHandler mcpToolHandler;
    private float uptimeStart;
    private bool isPaused = false;

    void Start()
    {
      Debug.Log("🌐 IPCBridge starting...");

      uptimeStart = Time.realtimeSinceStartup;
      cathedralRenderer = FindObjectOfType<CathedralRenderer>();
      mcpToolHandler = FindObjectOfType<MCPToolHandler>();

      if (cathedralRenderer == null)
      {
        Debug.LogError("❌ CathedralRenderer not found!");
        return;
      }

      if (mcpToolHandler == null)
      {
        Debug.LogWarning("⚠️ MCPToolHandler not found - MCP tools disabled");
      }

      // Only start IPC in batch mode (when called from Node.js)
      if (Application.isBatchMode && enableIPC)
      {
        Debug.Log("💎 Running in batch mode - starting IPC listeners");
        StartCoroutine(CommandListener());
        StartCoroutine(HeartbeatLoop());
      }
      else
      {
        Debug.Log("🎮 Running in Unity Editor - IPC disabled");
      }
    }

    /// <summary>
    /// Listen for commands from Node.js (stdin)
    /// </summary>
    IEnumerator CommandListener()
    {
      Debug.Log("🔮 IPC Command Listener started (Protocol v1.0.0)");

      while (true)
      {
        // Read from stdin (Node.js writes here)
        if (Console.KeyAvailable)
        {
          string json = Console.ReadLine();
          if (!string.IsNullOrEmpty(json))
          {
            ProcessMessage(json);
          }
        }

        yield return null; // Check every frame for low latency
      }
    }

    /// <summary>
    /// Process incoming JSON message
    /// </summary>
    void ProcessMessage(string json)
    {
      try
      {
        IPCMessage msg = JsonUtility.FromJson<IPCMessage>(json);

        if (string.IsNullOrEmpty(msg.type))
        {
          SendError("INVALID_MESSAGE", "Message type is required", "");
          return;
        }

        Debug.Log($"📨 IPC: {msg.type}");

        switch (msg.type)
        {
          case "initialize":
            var initData = JsonUtility.FromJson<InitializeData>(msg.data);
            ProcessInitialize(initData);
            break;

          case "update":
            var updateData = JsonUtility.FromJson<UpdateData>(msg.data);
            ProcessUpdate(updateData);
            break;

          case "render":
            var renderData = JsonUtility.FromJson<RenderData>(msg.data);
            ProcessRender(renderData);
            break;

          case "camera":
            var cameraData = JsonUtility.FromJson<CameraData>(msg.data);
            ProcessCamera(cameraData);
            break;

          case "postprocessing":
            var ppData = JsonUtility.FromJson<PostProcessingData>(msg.data);
            ProcessPostProcessing(ppData);
            break;

          case "setPaused":
            var pauseData = JsonUtility.FromJson<PauseData>(msg.data);
            ProcessSetPaused(pauseData);
            break;

          case "shutdown":
            ProcessShutdown();
            break;

          case "mcpToolCall":
            // Forward MCP tool calls to tool handler
            if (mcpToolHandler != null)
            {
              mcpToolHandler.ProcessToolCall(msg.data);
            }
            else
            {
              SendError("MCP_UNAVAILABLE", "MCPToolHandler not initialized", "");
            }
            break;

          default:
            SendError("INVALID_MESSAGE", $"Unknown message type: {msg.type}", "");
            break;
        }
      }
      catch (Exception e)
      {
        SendError("INVALID_MESSAGE", $"Failed to parse: {e.Message}", e.StackTrace);
      }
    }

    /// <summary>
    /// Process initialize command
    /// </summary>
    void ProcessInitialize(InitializeData data)
    {
      try
      {
        cathedralRenderer.UpdateStyleFromIPC(data);

        SendMessage("scene-loaded", new SceneLoadedData
        {
          sceneName = data.sceneName,
          objectCount = 156,
          renderTime = Time.realtimeSinceStartup
        });
      }
      catch (Exception e)
      {
        SendError("SCENE_LOAD_FAILED", e.Message, e.StackTrace);
      }
    }

    /// <summary>
    /// Process update command
    /// </summary>
    void ProcessUpdate(UpdateData data)
    {
      try
      {
        cathedralRenderer.UpdateParameters(data);

        SendMessage("update-ack", new UpdateAckData
        {
          success = true,
          message = "Parameters updated"
        });
      }
      catch (Exception e)
      {
        SendError("UPDATE_FAILED", e.Message, e.StackTrace);
      }
    }

    /// <summary>
    /// Process render command
    /// </summary>
    void ProcessRender(RenderData data)
    {
      StartCoroutine(RenderAndRespond(data));
    }

    IEnumerator RenderAndRespond(RenderData data)
    {
      yield return new WaitForEndOfFrame();

      try
      {
        string outputPath = cathedralRenderer.RenderToFile(data);

        SendMessage("render-complete", new RenderCompleteData
        {
          success = true,
          outputPath = outputPath,
          resolution = $"{data.width}x{data.height}"
        });
      }
      catch (Exception e)
      {
        SendError("RENDER_FAILED", e.Message, e.StackTrace);
      }
    }

    /// <summary>
    /// Process camera command
    /// </summary>
    void ProcessCamera(CameraData data)
    {
      try
      {
        cathedralRenderer.UpdateCamera(data);

        SendMessage("camera-changed", new CameraChangedData
        {
          position = Camera.main.transform.position,
          rotation = Camera.main.transform.rotation.eulerAngles
        });
      }
      catch (Exception e)
      {
        SendError("CAMERA_FAILED", e.Message, e.StackTrace);
      }
    }

    /// <summary>
    /// Process post-processing command
    /// </summary>
    void ProcessPostProcessing(PostProcessingData data)
    {
      try
      {
        cathedralRenderer.UpdatePostProcessing(data);

        SendMessage("update-ack", new UpdateAckData
        {
          success = true,
          message = "Post-processing updated"
        });
      }
      catch (Exception e)
      {
        SendError("POSTPROCESSING_FAILED", e.Message, e.StackTrace);
      }
    }

    /// <summary>
    /// Process set paused command
    /// </summary>
    void ProcessSetPaused(PauseData data)
    {
      isPaused = data.paused;
      Time.timeScale = isPaused ? 0f : 1f;

      SendMessage("update-ack", new UpdateAckData
      {
        success = true,
        message = isPaused ? "Paused" : "Resumed"
      });
    }

    /// <summary>
    /// Process shutdown command
    /// </summary>
    void ProcessShutdown()
    {
      SendMessage("update-ack", new UpdateAckData
      {
        success = true,
        message = "Shutting down gracefully"
      });

#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
      Application.Quit();
#endif
    }

    /// <summary>
    /// Send message to Node.js (stdout)
    /// </summary>
    void SendMessage(string type, object data)
    {
      var msg = new
      {
        type,
        timestamp = DateTime.UtcNow.ToString("o"),
        data
      };

      // Write to stdout (Node.js reads this)
      string json = JsonUtility.ToJson(msg);
      Console.WriteLine(json);
    }

    /// <summary>
    /// Send error message to Node.js
    /// </summary>
    void SendError(string errorCode, string message, string stackTrace)
    {
      SendMessage("error", new ErrorData
      {
        errorCode = errorCode,
        message = message,
        stackTrace = stackTrace
      });
    }

    /// <summary>
    /// Heartbeat loop to keep Node.js informed
    /// </summary>
    IEnumerator HeartbeatLoop()
    {
      while (true)
      {
        yield return new WaitForSeconds(heartbeatInterval);

        SendMessage("heartbeat", new HeartbeatData
        {
          uptime = Time.realtimeSinceStartup - uptimeStart,
          fps = (int)(1f / Time.smoothDeltaTime),
          state = isPaused ? "paused" : "running"
        });
      }
    }
  }

  // Additional data structures for IPC messages

  [Serializable]
  public class UpdateData
  {
    public float pinkIntensity;
    public float neonIntensity;
  }

  [Serializable]
  public class RenderData
  {
    public int width = 1920;
    public int height = 1080;
    public string format = "PNG";
    public string outputPath = "./renders/cathedral.png";
  }

  [Serializable]
  public class RenderCompleteData
  {
    public bool success;
    public string outputPath;
    public string resolution;
  }

  [Serializable]
  public class CameraData
  {
    public float[] position;
    public float[] rotation;
    public float fieldOfView = 60f;
  }

  [Serializable]
  public class CameraChangedData
  {
    public Vector3 position;
    public Vector3 rotation;
  }

  [Serializable]
  public class PostProcessingData
  {
    public float bloom = 3.0f;
    public float chromaticAberration = 0.3f;
    public float vignette = 0.4f;
  }

  [Serializable]
  public class PauseData
  {
    public bool paused;
  }
}
