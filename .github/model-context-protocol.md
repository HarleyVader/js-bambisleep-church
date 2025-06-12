# Model Context Protocol (MCP) Specifications

## Core Architecture

### Overview
MCP follows a client-server architecture where:
- **Hosts**: LLM applications (like Claude Desktop or IDEs) that initiate connections
- **Clients**: Maintain 1:1 connections with servers, inside the host application  
- **Servers**: Provide context, tools, and prompts to clients

### Message Format
Uses **JSON-RPC 2.0** as wire format with three message types:

#### Requests
```json
{
  "jsonrpc": "2.0",
  "id": "number | string",
  "method": "string", 
  "params": "object?"
}
```

#### Responses
```json
{
  "jsonrpc": "2.0",
  "id": "number | string",
  "result": "object?",
  "error": {
    "code": "number",
    "message": "string",
    "data": "unknown?"
  }
}
```

#### Notifications
```json
{
  "jsonrpc": "2.0",
  "method": "string",
  "params": "object?"
}
```

## Transports

### 1. Standard Input/Output (stdio)
- **Use for**: Local integrations, command-line tools, shell scripts
- **Benefits**: Simple process communication

### 2. Streamable HTTP  
- **Use for**: Web integrations, stateful sessions, multiple clients
- **Features**: HTTP POST for client-to-server, optional SSE for server-to-client
- **Security**: Origin validation, localhost binding, HTTPS for production

### 3. Custom Transports
Implement `Transport` interface:
```typescript
interface Transport {
  start(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>; 
  close(): Promise<void>;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
}
```

## Tools

### Definition Structure
```json
{
  "name": "string",
  "description": "string?",
  "inputSchema": {
    "type": "object",
    "properties": { "..." }
  },
  "annotations": {
    "title": "string?",
    "readOnlyHint": "boolean?",
    "destructiveHint": "boolean?", 
    "idempotentHint": "boolean?",
    "openWorldHint": "boolean?"
  }
}
```

### Tool Categories
- **System operations**: Execute commands, file operations
- **API integrations**: External service calls
- **Data processing**: Transform, analyze data

### Best Practices
1. Clear, descriptive names and descriptions
2. Detailed JSON Schema for parameters
3. Proper error handling within result object
4. Use `isError: true` for tool failures
5. Implement proper timeouts and validation

## Prompts

### Structure
```json
{
  "name": "string",
  "description": "string?", 
  "arguments": [
    {
      "name": "string",
      "description": "string?",
      "required": "boolean?"
    }
  ]
}
```

### Usage Patterns
- **Discovery**: `prompts/list` endpoint
- **Execution**: `prompts/get` with arguments
- **Dynamic content**: Embed resources, multi-step workflows

## Security Considerations

### Transport Security
- Use TLS for remote connections
- Validate connection origins  
- Implement authentication
- DNS rebinding protection

### Message Validation
- Validate all incoming messages
- Sanitize inputs
- Check message size limits
- Verify JSON-RPC format

### Access Control
- Implement proper authentication
- Use authorization checks
- Audit tool usage
- Rate limit requests

## Error Handling

### Standard Error Codes
```typescript
enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600, 
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603
}
```

### Best Practices
- Don't leak sensitive information
- Log security-relevant errors
- Implement proper cleanup
- Handle DoS scenarios

## Connection Lifecycle

### 1. Initialization
1. Client sends `initialize` request
2. Server responds with capabilities
3. Client sends `initialized` notification
4. Normal message exchange begins

### 2. Message Exchange
- Request-Response patterns
- One-way notifications

### 3. Termination
- Clean shutdown via `close()`
- Transport disconnection
- Error conditions

## Implementation Guidelines

### Server Setup
```typescript
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

const server = new Server({
  name: "example-server",
  version: "1.0.0" 
}, {
  capabilities: {
    resources: {},
    tools: {},
    prompts: {}
  }
});
```

### Tool Implementation
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = performOperation();
    return {
      content: [{ type: "text", text: String(result) }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${error.message}` }]
    };
  }
});
```

## LMStudio Integration

### Model Context Protocol (MCP) Orchestration

**Primary Model**: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`

- **Purpose**: Orchestrate MCP server tools with advanced reasoning
- **Endpoint**: <http://192.168.0.69:7777/v1/chat/completions>
- **Capabilities**: Tool selection, workflow orchestration, adaptive learning
- **Framework**: LMStudio MCP Framework (src/mcp/lmstudioMcpFramework.js)

#### MCP Integration Guidelines

1. **Always use LMStudio for tool orchestration** - Let the AI reason about which tools to use
2. **Leverage the framework's orchestration capabilities** - Don't manually chain tools
3. **Use structured output** - Configure response_format for JSON when needed
4. **Enable learning** - Allow the framework to learn from execution outcomes
5. **Respect the protocol** - Follow MCP JSON-RPC 2.0 specifications

### Framework Configuration

- **Endpoint**: `http://192.168.0.69:7777/v1/chat/completions`
- **Model**: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`
- **Capabilities**: Tool orchestration, workflow management, adaptive learning

### API Endpoints

#### Supported OpenAI-Compatible Endpoints

```http
GET  /v1/models
POST /v1/chat/completions
POST /v1/embeddings
POST /v1/completions
```

#### Client Setup

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://192.168.0.69:7777/v1",
    api_key="lm-studio"
)
```

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseUrl: "http://192.168.0.69:7777/v1",
  apiKey: "lm-studio"
});
```

### Tool Calling Implementation

#### Tool Definition Format

```json
{
  "type": "function",
  "function": {
    "name": "search_products",
    "description": "Search the product catalog by various criteria",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search terms or product name"
        },
        "category": {
          "type": "string",
          "description": "Product category to filter by",
          "enum": ["electronics", "clothing", "home", "outdoor"]
        },
        "max_price": {
          "type": "number",
          "description": "Maximum price in dollars"
        }
      },
      "required": ["query"],
      "additionalProperties": false
    }
  }
}
```

#### Single-Turn Tool Call Example

```python
def say_hello(name: str) -> str:
    print(f"Hello, {name}!")

tools = [{
    "type": "function",
    "function": {
        "name": "say_hello",
        "description": "Says hello to someone",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The person's name"
                }
            },
            "required": ["name"]
        }
    }
}]

response = client.chat.completions.create(
    model="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    messages=[{"role": "user", "content": "Say hello to Bob"}],
    tools=tools
)

# Execute tool if requested
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    name = eval(tool_call.function.arguments)["name"]
    say_hello(name)
```

#### Multi-Turn Tool Flow

```python
# 1. Initial request with tools
messages = [{"role": "user", "content": "When will order 123 be delivered?"}]

response = client.chat.completions.create(
    model="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    messages=messages,
    tools=tools
)

# 2. Execute tool and add results to conversation
if response.choices[0].message.tool_calls:
    # Add the assistant's tool call message
    messages.append(response.choices[0].message)
    
    for tool_call in response.choices[0].message.tool_calls:
        # Execute the tool
        result = execute_function(tool_call.function.name, tool_call.function.arguments)
        
        # Add tool result to conversation
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": str(result)
        })
    
    # 3. Get final response without tools
    final_response = client.chat.completions.create(
        model="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
        messages=messages
    )
```

### Structured Output

#### JSON Schema Response Format

```python
character_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "characters",
        "schema": {
            "type": "object",
            "properties": {
                "characters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "occupation": {"type": "string"},
                            "personality": {"type": "string"},
                            "background": {"type": "string"}
                        },
                        "required": ["name", "occupation", "personality", "background"]
                    },
                    "minItems": 1
                }
            },
            "required": ["characters"]
        }
    }
}

response = client.chat.completions.create(
    model="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    messages=[{"role": "user", "content": "Create 1-3 fictional characters"}],
    response_format=character_schema
)

results = json.loads(response.choices[0].message.content)
```

#### cURL Example for Structured Output

```bash
curl http://192.168.0.69:7777/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    "messages": [
      {"role": "system", "content": "You are a helpful jokester."},
      {"role": "user", "content": "Tell me a joke."}
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "joke_response",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "joke": {"type": "string"}
          },
          "required": ["joke"]
        }
      }
    }
  }'
```

### Supported Models

#### Native Tool Use Support

Models with hammer badge in LM Studio:

- **Qwen2.5**: `lmstudio-community/Qwen2.5-7B-Instruct-GGUF`
- **Llama-3.1/3.2**: `lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF`
- **Mistral**: `bartowski/Ministral-8B-Instruct-2410-GGUF`

#### Default Tool Use Support

All other models use custom system prompts with default tool call format.

### Streaming Tool Calls

```python
for chunk in client.chat.completions.create(
    model="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    messages=messages,
    tools=tools,
    stream=True
):
    if chunk.choices[0].delta.tool_calls:
        # Accumulate tool call chunks
        tool_call_chunk = chunk.choices[0].delta.tool_calls[0]
        if tool_call_chunk.function.name:
            function_name = tool_call_chunk.function.name
        if tool_call_chunk.function.arguments:
            function_args += tool_call_chunk.function.arguments
```

### Error Handling and Debugging

#### Tool Call Response Parsing

- LM Studio attempts to parse tool calls into `response.choices[0].message.tool_calls`
- Unparseable calls fall back to `response.choices[0].message.content`
- Check `finish_reason` for `"tool_calls"` to confirm successful parsing

#### Model Compatibility

- Models below 7B parameters may have limited structured output capability
- Check model README for tool use and structured output support
- Use `lms log stream` to debug tool call formatting issues

### Integration Best Practices

1. Let AI reason about tool selection
2. Use structured output with response_format for consistent data
3. Enable learning from execution outcomes
4. Follow JSON-RPC 2.0 specifications for MCP compatibility
5. Leverage framework orchestration capabilities
6. Implement proper error handling for tool failures
7. Use streaming for real-time tool execution feedback

### Model Context Protocol (MCP) Orchestration

**Primary Model**: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`
- **Purpose**: Orchestrate MCP server tools with advanced reasoning
- **Endpoint**: http://192.168.0.69:7777/v1/chat/completions
- **Capabilities**: Tool selection, workflow orchestration, adaptive learning
- **Framework**: LMStudio MCP Framework (src/mcp/lmstudioMcpFramework.js)

#### MCP Integration Guidelines
1. **Always use LMStudio for tool orchestration** - Let the AI reason about which tools to use
2. **Leverage the framework's orchestration capabilities** - Don't manually chain tools
3. **Use structured output** - Configure response_format for JSON when needed
4. **Enable learning** - Allow the framework to learn from execution outcomes
5. **Respect the protocol** - Follow MCP JSON-RPC 2.0 specifications
