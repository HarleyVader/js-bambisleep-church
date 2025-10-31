/**
 * BambiSleep™ Church - MCP Tool Handler
 * Exposes Unity cathedral functionality as MCP tools
 * Allows Node.js MCP Control Tower to directly manipulate cathedral
 */

using UnityEngine;
using System;
using System.Collections.Generic;

namespace BambiSleep.Cathedral
{
  /// <summary>
  /// MCP Tool call data structure
  /// </summary>
  [Serializable]
  public class MCPToolCall
  {
    public string tool;           // Tool name (e.g., "setCathedralStyle")
    public string parameters;     // JSON parameters
    public string callId;         // Unique call ID for response tracking
  }

  /// <summary>
  /// MCP Tool response data structure
  /// </summary>
  [Serializable]
  public class MCPToolResponse
  {
    public string callId;
    public bool success;
    public string result;         // JSON result data
    public string error;          // Error message if failed
  }

  /// <summary>
  /// Cathedral style update parameters
  /// </summary>
  [Serializable]
  public class StyleUpdateParams
  {
    public float pinkIntensity = -1f;  // -1 = no change
    public int eldritchLevel = -1;
    public float neonIntensity = -1f;
    public string lightingMode;         // "neon", "nuclear", "holy", "cursed"
  }

  /// <summary>
  /// Object spawn parameters
  /// </summary>
  [Serializable]
  public class SpawnObjectParams
  {
    public string objectType;      // "sphere", "cube", "cylinder", "cross", "angel"
    public float x, y, z;
    public float scale = 1f;
    public string color = "#FF00FF"; // Hex color
  }

  /// <summary>
  /// Physics interaction parameters
  /// </summary>
  [Serializable]
  public class PhysicsParams
  {
    public string action;          // "explode", "attract", "repel", "float"
    public float x, y, z;          // Center point
    public float force = 10f;
    public float radius = 10f;
  }

  /// <summary>
  /// MCP Tool Handler - Exposes Unity functionality to MCP ecosystem
  /// </summary>
  public class MCPToolHandler : MonoBehaviour
  {
    [Header("🌐 MCP Integration")]
    public bool enableMCPTools = true;

    private CathedralRenderer cathedralRenderer;
    private IPCBridge ipcBridge;
    private List<GameObject> spawnedObjects = new List<GameObject>();

    void Start()
    {
      Debug.Log("🔧 MCP Tool Handler initializing...");

      cathedralRenderer = FindObjectOfType<CathedralRenderer>();
      ipcBridge = FindObjectOfType<IPCBridge>();

      if (cathedralRenderer == null)
      {
        Debug.LogError("❌ CathedralRenderer not found - MCP tools disabled");
        enableMCPTools = false;
      }

      Debug.Log("✅ MCP Tool Handler ready");
    }

    /// <summary>
    /// Process MCP tool call from Node.js
    /// </summary>
    public void ProcessToolCall(string json)
    {
      if (!enableMCPTools)
      {
        SendToolError("", "MCP_DISABLED", "MCP tools are disabled");
        return;
      }

      try
      {
        MCPToolCall call = JsonUtility.FromJson<MCPToolCall>(json);

        Debug.Log($"🔧 MCP Tool Call: {call.tool}");

        switch (call.tool)
        {
          case "setCathedralStyle":
            HandleSetStyle(call);
            break;

          case "spawnObject":
            HandleSpawnObject(call);
            break;

          case "applyPhysics":
            HandlePhysics(call);
            break;

          case "clearObjects":
            HandleClearObjects(call);
            break;

          case "getCathedralStatus":
            HandleGetStatus(call);
            break;

          case "setTimeOfDay":
            HandleSetTimeOfDay(call);
            break;

          case "playAnimation":
            HandlePlayAnimation(call);
            break;

          default:
            SendToolError(call.callId, "UNKNOWN_TOOL", $"Unknown tool: {call.tool}");
            break;
        }
      }
      catch (Exception e)
      {
        SendToolError("", "PARSE_ERROR", $"Failed to parse tool call: {e.Message}");
      }
    }

    /// <summary>
    /// Handle setCathedralStyle tool
    /// Updates visual style in real-time
    /// </summary>
    void HandleSetStyle(MCPToolCall call)
    {
      try
      {
        StyleUpdateParams params_ = JsonUtility.FromJson<StyleUpdateParams>(call.parameters);

        // Apply updates to cathedral renderer
        if (params_.pinkIntensity >= 0)
        {
          cathedralRenderer.style.pinkIntensity = Mathf.Clamp01(params_.pinkIntensity);
        }

        if (params_.eldritchLevel >= 0)
        {
          cathedralRenderer.style.eldritchLevel = Mathf.Clamp(params_.eldritchLevel, 0, 1000);
        }

        if (params_.neonIntensity >= 0)
        {
          cathedralRenderer.style.neonIntensity = params_.neonIntensity;
        }

        if (!string.IsNullOrEmpty(params_.lightingMode))
        {
          cathedralRenderer.style.lighting = params_.lightingMode;
        }

        // Force visual update
        cathedralRenderer.UpdateVisuals();

        SendToolSuccess(call.callId, JsonUtility.ToJson(new
        {
          pinkIntensity = cathedralRenderer.style.pinkIntensity,
          eldritchLevel = cathedralRenderer.style.eldritchLevel,
          neonIntensity = cathedralRenderer.style.neonIntensity,
          lighting = cathedralRenderer.style.lighting
        }));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "STYLE_UPDATE_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle spawnObject tool
    /// Creates interactive objects in the cathedral
    /// </summary>
    void HandleSpawnObject(MCPToolCall call)
    {
      try
      {
        SpawnObjectParams params_ = JsonUtility.FromJson<SpawnObjectParams>(call.parameters);

        GameObject obj = null;
        PrimitiveType type = PrimitiveType.Sphere;

        switch (params_.objectType.ToLower())
        {
          case "sphere":
            type = PrimitiveType.Sphere;
            break;
          case "cube":
            type = PrimitiveType.Cube;
            break;
          case "cylinder":
            type = PrimitiveType.Cylinder;
            break;
          case "cross":
            obj = CreateCross();
            break;
          case "angel":
            obj = CreateAngel();
            break;
          default:
            type = PrimitiveType.Sphere;
            break;
        }

        if (obj == null)
        {
          obj = GameObject.CreatePrimitive(type);
        }

        obj.name = $"MCPSpawned_{params_.objectType}_{spawnedObjects.Count}";
        obj.transform.position = new Vector3(params_.x, params_.y, params_.z);
        obj.transform.localScale = Vector3.one * params_.scale;

        // Add physics
        Rigidbody rb = obj.AddComponent<Rigidbody>();
        rb.mass = params_.scale;

        // Parse and apply color
        Color color = ParseHexColor(params_.color);
        Material mat = new Material(Shader.Find("Standard"));
        mat.color = color;
        mat.EnableKeyword("_EMISSION");
        mat.SetColor("_EmissionColor", color * 2f);
        obj.GetComponent<Renderer>().material = mat;

        spawnedObjects.Add(obj);

        SendToolSuccess(call.callId, JsonUtility.ToJson(new
        {
          objectId = obj.GetInstanceID(),
          objectName = obj.name,
          position = obj.transform.position,
          scale = params_.scale
        }));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "SPAWN_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle applyPhysics tool
    /// Applies physics forces to objects
    /// </summary>
    void HandlePhysics(MCPToolCall call)
    {
      try
      {
        PhysicsParams params_ = JsonUtility.FromJson<PhysicsParams>(call.parameters);
        Vector3 center = new Vector3(params_.x, params_.y, params_.z);

        int affectedCount = 0;

        switch (params_.action.ToLower())
        {
          case "explode":
            affectedCount = ApplyExplosion(center, params_.force, params_.radius);
            break;
          case "attract":
            affectedCount = ApplyAttraction(center, params_.force, params_.radius);
            break;
          case "repel":
            affectedCount = ApplyRepulsion(center, params_.force, params_.radius);
            break;
          case "float":
            affectedCount = ApplyFloat(params_.force);
            break;
          default:
            SendToolError(call.callId, "INVALID_ACTION", $"Unknown physics action: {params_.action}");
            return;
        }

        SendToolSuccess(call.callId, JsonUtility.ToJson(new
        {
          action = params_.action,
          affectedObjects = affectedCount
        }));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "PHYSICS_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle clearObjects tool
    /// Removes all spawned objects
    /// </summary>
    void HandleClearObjects(MCPToolCall call)
    {
      try
      {
        int count = spawnedObjects.Count;

        foreach (GameObject obj in spawnedObjects)
        {
          if (obj != null)
          {
            Destroy(obj);
          }
        }

        spawnedObjects.Clear();

        SendToolSuccess(call.callId, JsonUtility.ToJson(new
        {
          clearedCount = count
        }));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "CLEAR_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle getCathedralStatus tool
    /// Returns current cathedral state
    /// </summary>
    void HandleGetStatus(MCPToolCall call)
    {
      try
      {
        var status = new
        {
          pinkIntensity = cathedralRenderer.style.pinkIntensity,
          eldritchLevel = cathedralRenderer.style.eldritchLevel,
          neonIntensity = cathedralRenderer.style.neonIntensity,
          lighting = cathedralRenderer.style.lighting,
          spawnedObjectCount = spawnedObjects.Count,
          fps = (int)(1f / Time.deltaTime),
          uptime = Time.realtimeSinceStartup
        };

        SendToolSuccess(call.callId, JsonUtility.ToJson(status));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "STATUS_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle setTimeOfDay tool
    /// Changes lighting to simulate time
    /// </summary>
    void HandleSetTimeOfDay(MCPToolCall call)
    {
      try
      {
        var params_ = JsonUtility.FromJson<Dictionary<string, float>>(call.parameters);
        float hour = params_["hour"]; // 0-24

        // Adjust ambient light based on time
        Color skyColor;
        Color equatorColor;
        float intensity;

        if (hour >= 6 && hour < 12) // Morning
        {
          skyColor = new Color(0.5f, 0.7f, 1f);
          equatorColor = new Color(1f, 0.8f, 0.6f);
          intensity = Mathf.Lerp(0.5f, 1f, (hour - 6f) / 6f);
        }
        else if (hour >= 12 && hour < 18) // Afternoon
        {
          skyColor = new Color(0.4f, 0.6f, 1f);
          equatorColor = new Color(1f, 0.9f, 0.7f);
          intensity = 1f;
        }
        else if (hour >= 18 && hour < 22) // Evening
        {
          skyColor = new Color(0.2f, 0.2f, 0.4f);
          equatorColor = new Color(1f, 0.5f, 0.3f);
          intensity = Mathf.Lerp(1f, 0.3f, (hour - 18f) / 4f);
        }
        else // Night
        {
          skyColor = new Color(0.1f, 0.1f, 0.2f);
          equatorColor = new Color(0.3f, 0.2f, 0.4f);
          intensity = 0.2f;
        }

        RenderSettings.ambientSkyColor = skyColor;
        RenderSettings.ambientEquatorColor = equatorColor;
        RenderSettings.ambientIntensity = intensity;

        SendToolSuccess(call.callId, JsonUtility.ToJson(new
        {
          hour = hour,
          skyColor = ColorUtility.ToHtmlStringRGB(skyColor),
          intensity = intensity
        }));
      }
      catch (Exception e)
      {
        SendToolError(call.callId, "TIME_CHANGE_FAILED", e.Message);
      }
    }

    /// <summary>
    /// Handle playAnimation tool
    /// Triggers predefined animations
    /// </summary>
    void HandlePlayAnimation(MCPToolCall call)
    {
      // Placeholder for animation system
      SendToolError(call.callId, "NOT_IMPLEMENTED", "Animation system not yet implemented");
    }

    // ============================================
    // Helper Methods
    // ============================================

    GameObject CreateCross()
    {
      GameObject cross = new GameObject("Cross");

      // Vertical beam
      GameObject vertical = GameObject.CreatePrimitive(PrimitiveType.Cube);
      vertical.transform.parent = cross.transform;
      vertical.transform.localScale = new Vector3(0.5f, 3f, 0.5f);

      // Horizontal beam
      GameObject horizontal = GameObject.CreatePrimitive(PrimitiveType.Cube);
      horizontal.transform.parent = cross.transform;
      horizontal.transform.localScale = new Vector3(2f, 0.5f, 0.5f);
      horizontal.transform.localPosition = Vector3.up * 1f;

      return cross;
    }

    GameObject CreateAngel()
    {
      GameObject angel = new GameObject("Angel");

      // Body (sphere)
      GameObject body = GameObject.CreatePrimitive(PrimitiveType.Sphere);
      body.transform.parent = angel.transform;
      body.transform.localScale = Vector3.one;

      // Wings (cubes)
      GameObject leftWing = GameObject.CreatePrimitive(PrimitiveType.Cube);
      leftWing.transform.parent = angel.transform;
      leftWing.transform.localScale = new Vector3(0.2f, 1.5f, 0.8f);
      leftWing.transform.localPosition = new Vector3(-0.7f, 0.2f, 0f);
      leftWing.transform.localRotation = Quaternion.Euler(0, 0, -30f);

      GameObject rightWing = GameObject.CreatePrimitive(PrimitiveType.Cube);
      rightWing.transform.parent = angel.transform;
      rightWing.transform.localScale = new Vector3(0.2f, 1.5f, 0.8f);
      rightWing.transform.localPosition = new Vector3(0.7f, 0.2f, 0f);
      rightWing.transform.localRotation = Quaternion.Euler(0, 0, 30f);

      return angel;
    }

    int ApplyExplosion(Vector3 center, float force, float radius)
    {
      int count = 0;
      Collider[] colliders = Physics.OverlapSphere(center, radius);

      foreach (Collider col in colliders)
      {
        Rigidbody rb = col.GetComponent<Rigidbody>();
        if (rb != null)
        {
          rb.AddExplosionForce(force, center, radius, 3f);
          count++;
        }
      }

      return count;
    }

    int ApplyAttraction(Vector3 center, float force, float radius)
    {
      int count = 0;
      Collider[] colliders = Physics.OverlapSphere(center, radius);

      foreach (Collider col in colliders)
      {
        Rigidbody rb = col.GetComponent<Rigidbody>();
        if (rb != null)
        {
          Vector3 direction = (center - rb.position).normalized;
          rb.AddForce(direction * force);
          count++;
        }
      }

      return count;
    }

    int ApplyRepulsion(Vector3 center, float force, float radius)
    {
      return ApplyExplosion(center, force, radius);
    }

    int ApplyFloat(float force)
    {
      int count = 0;

      foreach (GameObject obj in spawnedObjects)
      {
        if (obj != null)
        {
          Rigidbody rb = obj.GetComponent<Rigidbody>();
          if (rb != null)
          {
            rb.AddForce(Vector3.up * force);
            count++;
          }
        }
      }

      return count;
    }

    Color ParseHexColor(string hex)
    {
      Color color;
      if (ColorUtility.TryParseHtmlString(hex, out color))
      {
        return color;
      }
      return Color.magenta; // Default pink
    }

    void SendToolSuccess(string callId, string result)
    {
      MCPToolResponse response = new MCPToolResponse
      {
        callId = callId,
        success = true,
        result = result,
        error = null
      };

      string json = JsonUtility.ToJson(response);
      Console.WriteLine(json); // Send to stdout (Node.js reads this)
      Debug.Log($"✅ MCP Tool Success: {callId}");
    }

    void SendToolError(string callId, string errorCode, string message)
    {
      MCPToolResponse response = new MCPToolResponse
      {
        callId = callId,
        success = false,
        result = null,
        error = $"{errorCode}: {message}"
      };

      string json = JsonUtility.ToJson(response);
      Console.WriteLine(json);
      Debug.LogError($"❌ MCP Tool Error [{errorCode}]: {message}");
    }
  }
}
