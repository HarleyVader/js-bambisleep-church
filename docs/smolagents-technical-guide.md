# Smolagents Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [MK-XII Integration](#mk-xii-integration)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [Agent Types](#agent-types)
6. [Model Integration](#model-integration)
7. [Tools & Tool Creation](#tools--tool-creation)
8. [JavaScript ES6 Agent Integration](#javascript-es6-agent-integration)
9. [Multi-Agent Systems](#multi-agent-systems)
10. [Security & Execution](#security--execution)
11. [Best Practices](#best-practices)
12. [Integration Patterns](#integration-patterns)
13. [Troubleshooting](#troubleshooting)

## Overview

Smolagents is an open-source Python library for building and running AI agents with minimal code (~1000 lines of core logic). It provides two distinct paradigms for agent behavior: code generation and structured tool calling.

### Key Features

- **Minimal complexity**: Simple abstractions over raw code
- **Two agent paradigms**: CodeAgent (Python generation) and ToolCallingAgent (JSON calls)
- **Model-agnostic**: 100+ LLM providers via multiple integrations
- **Modality-agnostic**: Text, vision, video, and audio support
- **Tool ecosystem**: MCP, LangChain, Hub Spaces integration
- **Multi-agent support**: Hierarchical agent systems
- **Security-first**: Sandboxed execution and controlled imports

## Architecture

### Core Components

```mermaid
┌─────────────────┐    ┌──────────────────┐
│   Agent Types   │    │     Models       │
├─────────────────┤    ├──────────────────┤
│ • CodeAgent     │◄──►│ • InferenceClient│
│ • ToolCalling   │    │ • LiteLLM        │
└─────────────────┘    │ • Transformers   │
         │             │ • Azure/AWS      │
         ▼             └──────────────────┘
┌─────────────────┐              ▲
│     Tools       │              │
├─────────────────┤              │
│ • Default Tools │              │
│ • Custom Tools  │◄─────────────┤
│ • Hub Tools     │              │
│ • MCP Tools     │              │
└─────────────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│   Execution     │              │
├─────────────────┤              │
│ • Local Python  │              │
│ • E2B Sandbox   │              │
│ • Docker        │──────────────┘
└─────────────────┘
```

### Agent Paradigms

| Aspect | CodeAgent | ToolCallingAgent |
|--------|-----------|------------------|
| Output | Python code snippets | JSON tool calls |
| Execution | Local/sandbox Python | Structured validation |
| Expressivity | High (loops, logic, composition) | Low (predefined actions) |
| Safety | Requires sandbox | Inherently safe |
| Use Case | Complex reasoning, multi-step | Simple API calls, dispatch |

## Installation & Setup

### Basic Installation

```bash
# Minimal installation
pip install smolagents

# With default toolkit (recommended)
pip install smolagents[toolkit]

# With all optional dependencies
pip install smolagents[toolkit,transformers,litellm]
```

### Environment Setup

```bash
# Required for Hub access
export HF_TOKEN="your_huggingface_token"

# Optional: E2B for sandboxed execution
export E2B_API_KEY="your_e2b_key"

# Optional: OpenAI/Anthropic for LiteLLM
export OPENAI_API_KEY="your_openai_key"
```

### Quick Start

```python
from smolagents import CodeAgent, InferenceClientModel

# Initialize model
model = InferenceClientModel()

# Create agent
agent = CodeAgent(
    tools=[],
    model=model,
    add_base_tools=True  # Adds web search, Python interpreter
)

# Run task
result = agent.run("Calculate the fibonacci sequence up to 100")
print(result)
```

## Agent Types

### CodeAgent

Generates Python code to solve tasks. Best for complex reasoning and multi-step problems.

```python
from smolagents import CodeAgent, InferenceClientModel

model = InferenceClientModel()
agent = CodeAgent(
    tools=[],
    model=model,
    additional_authorized_imports=['requests', 'bs4'],  # Security control
    executor_type="local"  # Options: "local", "e2b", "docker"
)

# Complex reasoning example
result = agent.run("""
Fetch the title of https://example.com, 
then calculate how many words are in it,
and finally determine if it's a prime number.
""")
```

#### CodeAgent Configuration

```python
agent = CodeAgent(
    tools=tool_list,
    model=model,
    additional_authorized_imports=[
        'requests',      # HTTP requests
        'bs4',          # Web scraping
        'numpy',        # Scientific computing
        'pandas',       # Data manipulation
        'matplotlib'    # Plotting
    ],
    executor_type="e2b",  # Secure sandbox
    max_steps=10,         # Step limit
    final_answer_checks=[custom_validator]  # Output validation
)
```

### ToolCallingAgent

Uses structured JSON for tool calls. Best for reliable, predictable interactions.

```python
from smolagents import ToolCallingAgent, InferenceClientModel

model = InferenceClientModel()
agent = ToolCallingAgent(
    tools=[WebSearchTool(), VisitWebpageTool()],
    model=model,
    max_steps=5
)

# Structured tool calling
result = agent.run("Search for Python tutorials and visit the first result")
```

## Model Integration

### InferenceClient (Recommended)

```python
from smolagents import InferenceClientModel

# Default model
model = InferenceClientModel()

# Specific model
model = InferenceClientModel(
    model_id="meta-llama/Llama-3.3-70B-Instruct",
    token="your_hf_token"
)

# With provider specification
model = InferenceClientModel(
    model_id="gpt-4",
    provider="openai"  # or "anthropic", "together", etc.
)
```

### LiteLLM (100+ Models)

```python
from smolagents import LiteLLMModel

# OpenAI
model = LiteLLMModel(model_id="gpt-4")

# Anthropic
model = LiteLLMModel(model_id="claude-3-sonnet-20240229")

# Local models
model = LiteLLMModel(model_id="ollama/llama2")
```

### Local Transformers

```python
from smolagents import TransformersModel

model = TransformersModel(
    model_id="microsoft/DialoGPT-medium",
    device="cuda:0"  # or "cpu"
)
```

### Azure OpenAI

```python
from smolagents import AzureOpenAIServerModel

model = AzureOpenAIServerModel(
    azure_endpoint="https://your-resource.openai.azure.com/",
    api_version="2024-02-01",
    model="gpt-4"
)
```

### Amazon Bedrock

```python
from smolagents import AmazonBedrockServerModel

model = AmazonBedrockServerModel(
    model_id="anthropic.claude-3-sonnet-20240229-v1:0",
    region_name="us-east-1"
)
```

### LMStudio MCP Framework

```python
from smolagents import InferenceClientModel

# LMStudio with MCP orchestration capabilities
model = InferenceClientModel(
    base_url="http://192.168.0.69:7777/v1",
    model_id="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
    api_key="lm-studio"
)

# Features:
# - Tool orchestration and reasoning
# - Structured output with JSON schema
# - Multi-turn tool workflows
# - Adaptive learning from execution outcomes
```

## Tools & Tool Creation

### Default Tools

```python
from smolagents import (
    WebSearchTool,           # DuckDuckGo search
    PythonInterpreterTool,   # Code execution
    SpeechToTextTool,        # Audio transcription
    VisitWebpageTool,        # Web content extraction
    UserInputTool,           # User interaction
    FinalAnswerTool          # Task completion
)

# Usage
search = WebSearchTool(max_results=5)
results = search("Python machine learning tutorials")
```

### Custom Tool Creation

#### Method 1: Function Decorator

```python
from smolagents import tool

@tool
def get_weather(city: str, country: str = "US") -> str:
    """
    Get current weather for a city.
    
    Args:
        city: Name of the city
        country: Country code (default: US)
    """
    # Implementation
    api_key = "your_weather_api_key"
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": f"{city},{country}",
        "appid": api_key,
        "units": "metric"
    }
    response = requests.get(url, params=params)
    data = response.json()
    return f"Temperature in {city}: {data['main']['temp']}°C"

# Use in agent
agent = CodeAgent(tools=[get_weather], model=model)
```

#### Method 2: Tool Subclass

```python
from smolagents import Tool

class DatabaseQueryTool(Tool):
    name = "database_query"
    description = "Execute SQL queries on the database"
    inputs = {
        "query": {
            "type": str,
            "description": "SQL query to execute"
        }
    }
    output_type = str
    
    def __init__(self, connection_string: str):
        super().__init__()
        self.connection_string = connection_string
        self.setup()
    
    def setup(self):
        """Initialize database connection"""
        self.connection = sqlite3.connect(self.connection_string)
    
    def forward(self, query: str) -> str:
        """Execute the query"""
        cursor = self.connection.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        return str(results)

# Usage
db_tool = DatabaseQueryTool("database.db")
agent = CodeAgent(tools=[db_tool], model=model)
```

### Hub Tools

```python
from smolagents import load_tool

# Load from Hub
image_generator = load_tool(
    "m-ric/text-to-image",
    trust_remote_code=True
)

# Use in agent
agent = CodeAgent(tools=[image_generator], model=model)
```

### Space-to-Tool Conversion

```python
from smolagents import Tool

# Convert Gradio Space to tool
face_swapper = Tool.from_space(
    space_id="tuan2308/face-swap",
    name="face_swapper",
    description="Swap faces between two images"
)
```

### MCP Integration

#### Standard MCP Server Integration

```python
from smolagents import ToolCollection

# Stdio MCP server
server_params = {
    "command": "uvx",
    "args": ["--quiet", "mcp-server-package"],
    "env": {"UV_PYTHON": "3.12"}
}

with ToolCollection.from_mcp(server_params, trust_remote_code=True) as tools:
    agent = CodeAgent(tools=list(tools.tools), model=model)
    result = agent.run("Your task here")
```

#### LMStudio MCP Framework Integration

```python
from smolagents import InferenceClientModel, CodeAgent
import requests

# LMStudio MCP Framework Configuration
class LMStudioMCPModel(InferenceClientModel):
    def __init__(self):
        # LMStudio endpoint for MCP orchestration
        self.base_url = "http://192.168.0.69:7777/v1"
        self.model_id = "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0"
        super().__init__(
            model_id=self.model_id,
            base_url=self.base_url,
            api_key="lm-studio"
        )

# MCP-aware agent setup
mcp_model = LMStudioMCPModel()
agent = CodeAgent(
    tools=[],  # Tools managed by MCP framework
    model=mcp_model,
    additional_authorized_imports=['requests', 'json']
)

# Structured output with MCP
def run_with_structured_output(agent, prompt, schema):
    """Run agent with JSON schema response format"""
    response = agent.model.client.chat.completions.create(
        model=agent.model.model_id,
        messages=[{"role": "user", "content": prompt}],
        response_format={
            "type": "json_schema",
            "json_schema": schema
        }
    )
    return json.loads(response.choices[0].message.content)
```

#### MCP Tool Call Pattern

```python
# Multi-turn MCP tool execution
def execute_mcp_workflow(agent, initial_prompt, tools):
    messages = [{"role": "user", "content": initial_prompt}]
    
    response = agent.model.client.chat.completions.create(
        model=agent.model.model_id,
        messages=messages,
        tools=tools
    )
    
    # Handle tool calls through MCP
    if response.choices[0].message.tool_calls:
        messages.append(response.choices[0].message)
        
        for tool_call in response.choices[0].message.tool_calls:
            # MCP framework handles tool execution
            result = execute_mcp_tool(tool_call)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result)
            })
        
        # Get final orchestrated response
        final_response = agent.model.client.chat.completions.create(
            model=agent.model.model_id,
            messages=messages
        )
        return final_response.choices[0].message.content
    
    return response.choices[0].message.content
```

### LangChain Tool Integration

```python
from smolagents import Tool
from langchain.tools import DuckDuckGoSearchRun

# Convert LangChain tool
langchain_search = DuckDuckGoSearchRun()
search_tool = Tool.from_langchain(langchain_search)

agent = CodeAgent(tools=[search_tool], model=model)
```

## JavaScript ES6 Agent Integration

### Overview

Smolagents supports JavaScript ES6 execution through a dedicated JavaScriptAgent that provides modern JavaScript capabilities including arrow functions, destructuring, async/await, and template literals.

### JavaScript Agent Architecture

```mermaid
┌─────────────────┐    ┌──────────────────┐
│ JavaScriptAgent │    │    Node.js       │
├─────────────────┤    ├──────────────────┤
│ • ES6 Support   │◄──►│ • Runtime Exec   │
│ • Error Handle  │    │ • Temp Files     │
│ • Context Pass  │    │ • JSON I/O       │
└─────────────────┘    └──────────────────┘
         │                       ▲
         ▼                       │
┌─────────────────┐              │
│ JavaScriptTool  │              │
├─────────────────┤              │
│ • Tool Interface│◄─────────────┤
│ • Code Execution│              │
│ • Result Return │              │
└─────────────────┘              │
```

### Basic Usage

```python
from smolagents import JavaScriptAgent, JavaScriptTool

# Create JavaScript agent
js_agent = JavaScriptAgent()

# Execute ES6 code
result = js_agent.execute_code("""
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = doubled.reduce((acc, curr) => acc + curr, 0);
return { doubled, sum };
""")

print(result)  # {'success': True, 'result': {'doubled': [2,4,6,8,10], 'sum': 30}}
```

### ES6 Feature Examples

#### Arrow Functions and Destructuring

```python
js_code = """
const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
];

// Arrow functions with destructuring
const getNames = users => users.map(({ name }) => name);
const getAverageAge = users => {
    const total = users.reduce((sum, { age }) => sum + age, 0);
    return total / users.length;
};

return {
    names: getNames(users),
    averageAge: getAverageAge(users)
};
"""

result = js_agent.execute_code(js_code)
```

#### Async/Await with Promises

```python
async_js_code = """
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchData = async () => {
    await delay(100);
    return { data: 'Hello from async JS!', timestamp: Date.now() };
};

// Return the promise result
return fetchData();
"""

result = js_agent.execute_code(async_js_code)
```

#### Template Literals and Modern Syntax

```python
modern_js_code = """
const user = { name: 'Bambi', session: 'deep-sleep' };
const timestamp = new Date().toISOString();

// Template literals
const message = `User ${user.name} started ${user.session} session at ${timestamp}`;

// Object spread and computed properties
const sessionData = {
    ...user,
    [`${user.session}_started`]: timestamp,
    status: 'active'
};

return { message, sessionData };
"""

result = js_agent.execute_code(modern_js_code)
```

### Integration with Smolagents Framework

#### As a Tool in CodeAgent

```python
from smolagents import CodeAgent, InferenceClientModel, JavaScriptTool

model = InferenceClientModel()
js_tool = JavaScriptTool()

agent = CodeAgent(
    tools=[js_tool],
    model=model,
    add_base_tools=True
)

# Agent can now execute JavaScript
result = agent.run("""
I need to process an array of numbers [1,2,3,4,5] using JavaScript.
Use arrow functions to double each number and calculate the sum.
""")
```

#### Multi-Language Agent

```python
class MultiLanguageAgent:
    def __init__(self, model):
        self.python_agent = CodeAgent(tools=[], model=model)
        self.js_agent = JavaScriptAgent()
        self.model = model
    
    def execute_task(self, task_description, language_preference=None):
        """Execute task in optimal language"""
        
        if language_preference == "javascript" or "js" in task_description.lower():
            # Use JavaScript for frontend/web tasks
            js_code = self.generate_js_solution(task_description)
            return self.js_agent.execute_code(js_code)
        else:
            # Use Python for general tasks
            return self.python_agent.run(task_description)
    
    def generate_js_solution(self, task):
        """Generate JavaScript code for task"""
        prompt = f"""
        Generate ES6 JavaScript code to solve this task: {task}
        Use modern JavaScript features like arrow functions, destructuring, async/await.
        Return the final result.
        """
        
        response = self.model.generate(prompt)
        return response
```

### Error Handling and Security

#### Runtime Validation

```python
def safe_js_execution(code, timeout=30):
    """Execute JavaScript with safety controls"""
    js_agent = JavaScriptAgent()
    
    # Check Node.js availability
    if not js_agent.runtime_available:
        return {"error": "Node.js runtime not available"}
    
    # Execute with timeout
    try:
        result = js_agent.execute_code(code)
        
        if result.get("success"):
            return result
        else:
            return {"error": f"JavaScript execution failed: {result.get('error')}"}
            
    except Exception as e:
        return {"error": f"Execution error: {str(e)}"}
```

#### Input Sanitization

```python
def sanitize_js_input(code):
    """Basic JavaScript code sanitization"""
    # Block dangerous operations
    dangerous_patterns = [
        'require(',        # Node.js imports
        'process.',        # Process access
        'fs.',            # File system
        'child_process',  # System commands
        'eval(',          # Code evaluation
        'Function('       # Dynamic functions
    ]
    
    for pattern in dangerous_patterns:
        if pattern in code:
            raise ValueError(f"Dangerous pattern detected: {pattern}")
    
    return code
```

### MK-XII Integration Patterns

#### MK-XII JavaScript Workflow

```python
class MKXIIJavaScriptAgent:
    """
    MK-XII JavaScript agent following minimal complexity principles
    Core Rules: Function over form, Working code over perfect code, Less is more
    """
    
    def __init__(self):
        # Function over form - minimal setup
        self.js_agent = JavaScriptAgent()
        self.task_dir = Path(".tasks")
    
    def imagine_js_solution(self, task_description):
        """IMAGINE: Think More, Code Less for JavaScript tasks"""
        # Check if existing JS solution exists
        existing_solution = self.check_existing_js_tasks()
        if existing_solution:
            return existing_solution
        
        # Minimal viable JS approach
        return {
            "language": "javascript",
            "approach": "minimal_es6",
            "features": ["arrow_functions", "destructuring"],
            "complexity": "minimal"
        }
    
    def creation_js_phase(self, task_plan):
        """CREATION: Single Implementation Loop for JavaScript"""
        js_code = self.generate_minimal_js_code(task_plan)
        
        # Execute with progress tracking
        result = self.js_agent.execute_code(js_code)
        
        # Update completion percentage
        self.update_js_task_progress(task_plan, result)
        
        return result
    
    def compact_js_phase(self, js_result):
        """COMPACT: Clean up JavaScript implementation"""
        # Remove console.logs and debug code
        cleaned_result = self.remove_js_debug_code(js_result)
        
        # Consolidate structure
        final_result = self.consolidate_js_output(cleaned_result)
        
        # STOP - don't add features
        return final_result
    
    def generate_minimal_js_code(self, task_plan):
        """Generate minimal ES6 code following MK-XII principles"""
        return f"""
        // MK-XII: Function over form - minimal approach
        const solve = () => {{
            // Working code over perfect code
            const result = processTask();
            return result;
        }};
        
        const processTask = () => {{
            // Less is more - single purpose function
            return "task_completed";
        }};
        
        return solve();
        """

# MK-XII JavaScript usage example
def mk_xii_js_workflow():
    """MK-XII JavaScript workflow example"""
    
    # IMAGINE: Check existing tasks first
    js_agent = MKXIIJavaScriptAgent()
    task_plan = js_agent.imagine_js_solution("process bambi sleep data")
    
    # CREATION: Minimal implementation
    result = js_agent.creation_js_phase(task_plan)
    
    # COMPACT: Clean up and mark complete
    final_result = js_agent.compact_js_phase(result)
    
    return final_result
```

### LMStudio MCP JavaScript Integration

```python
class LMStudioJavaScriptMCP:
    """JavaScript integration with LMStudio MCP Framework"""
    
    def __init__(self):
        self.endpoint = "http://192.168.0.69:7777/v1"
        self.model = "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0"
        self.js_agent = JavaScriptAgent()
    
    def orchestrate_js_task(self, task_description):
        """Use LMStudio to generate and execute JavaScript"""
        
        # Let LMStudio generate ES6 code
        js_code = self.generate_js_with_lmstudio(task_description)
        
        # Execute through smolagents JavaScript agent
        result = self.js_agent.execute_code(js_code)
        
        return {
            "generated_code": js_code,
            "execution_result": result,
            "mcp_orchestrated": True
        }
    
    def generate_js_with_lmstudio(self, task):
        """Generate JavaScript using LMStudio reasoning model"""
        from openai import OpenAI
        
        client = OpenAI(
            base_url=self.endpoint,
            api_key="lm-studio"
        )
        
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Generate clean ES6 JavaScript code. Use modern features like arrow functions, destructuring, async/await. Return only the code."
                },
                {
                    "role": "user",
                    "content": f"Task: {task}"
                }
            ]
        )
        
        return response.choices[0].message.content
```

### Best Practices for JavaScript Integration

#### 1. Runtime Management

```python
# Always check Node.js availability
js_agent = JavaScriptAgent()
if not js_agent.runtime_available:
    # Fallback to Python implementation
    fallback_agent = CodeAgent(tools=[], model=model)
    result = fallback_agent.run(task)
```

#### 2. Context Passing

```python
# Pass context between JavaScript and Python
context = {
    "user_data": {"name": "Bambi", "session": "sleep"},
    "config": {"timeout": 30, "debug": False}
}

js_result = js_agent.execute_code("""
// Access context data
const { user_data, config } = context;
const greeting = `Hello ${user_data.name}, starting ${user_data.session}`;
return { greeting, timestamp: Date.now() };
""", context=context)
```

#### 3. Error Recovery

```python
def robust_js_execution(code, fallback_code=None):
    """Execute JavaScript with automatic fallback"""
    js_agent = JavaScriptAgent()
    
    result = js_agent.execute_code(code)
    
    if not result.get("success") and fallback_code:
        # Try fallback approach
        fallback_result = js_agent.execute_code(fallback_code)
        return fallback_result
    
    return result
```

### Deployment Considerations

#### Node.js Requirements

```bash
# Ensure Node.js is available in deployment environment
node --version  # Should be v14+ for ES6 support

# For Docker deployments
FROM node:18-alpine
RUN npm install -g npm@latest
```

#### Production Configuration

```python
# Production JavaScript agent setup
production_js_agent = JavaScriptAgent()

# Verify runtime in production
if not production_js_agent.runtime_available:
    logger.error("Node.js runtime not available in production")
    # Use alternative implementation or fail gracefully
```

### Troubleshooting JavaScript Integration

#### Common Issues

1. **Node.js Not Found**

   ```python
   # Solution: Install Node.js or use alternative
   if not js_agent.runtime_available:
       print("Install Node.js: https://nodejs.org/")
   ```

2. **ES6 Syntax Errors**

   ```python
   # Check Node.js version supports ES6
   result = subprocess.run(['node', '--version'], capture_output=True, text=True)
   version = result.stdout.strip()
   print(f"Node.js version: {version}")
   ```

3. **Timeout Issues**

   ```python
   # Increase timeout for complex operations
   js_agent.execute_code(code, timeout=60)  # 60 second timeout
   ```

#### Debug Mode

```python
# Enable JavaScript debugging
js_agent = JavaScriptAgent(debug=True)
result = js_agent.execute_code("""
console.log('Debug: Processing data...');
const data = [1, 2, 3];
console.log('Debug: Data processed:', data);
return data;
""")
```

## Multi-Agent Systems

### Basic Multi-Agent Setup

```python
from smolagents import CodeAgent, InferenceClientModel, WebSearchTool

model = InferenceClientModel()

# Specialized web search agent
web_agent = CodeAgent(
    tools=[WebSearchTool()],
    model=model,
    name="web_search_agent",
    description="Performs web searches and content analysis"
)

# Specialized data analysis agent
data_agent = CodeAgent(
    tools=[],  # Add data analysis tools
    model=model,
    name="data_analyst",
    description="Analyzes data and generates reports"
)

# Manager agent
manager = CodeAgent(
    tools=[],
    model=model,
    managed_agents=[web_agent, data_agent]
)

# Run coordinated task
result = manager.run("""
Search for latest AI research papers, 
analyze the trends, and create a summary report.
""")
```

### Advanced Multi-Agent Patterns

```python
# Content Pipeline Example
class ContentPipeline:
    def __init__(self, model):
        self.finder_agent = CodeAgent(
            tools=[WebSearchTool(), VisitWebpageTool()],
            model=model,
            name="content_finder",
            description="Finds and extracts content from web sources"
        )
        
        self.analyzer_agent = CodeAgent(
            tools=[],  # Custom analysis tools
            model=model,
            name="content_analyzer", 
            description="Analyzes content quality and relevance"
        )
        
        self.manager = CodeAgent(
            tools=[],
            model=model,
            managed_agents=[self.finder_agent, self.analyzer_agent]
        )
    
    def process_content(self, topic: str):
        return self.manager.run(f"""
        1. Find recent content about {topic}
        2. Analyze the quality and relevance
        3. Provide a ranked list of the best sources
        """)
```

## Security & Execution

### Execution Environments

#### Local Execution (Default)

```python
agent = CodeAgent(
    tools=[],
    model=model,
    executor_type="local",
    additional_authorized_imports=['requests', 'json']
)
```

#### E2B Sandbox (Recommended for Production)

```python
# Requires E2B_API_KEY environment variable
agent = CodeAgent(
    tools=[],
    model=model,
    executor_type="e2b"
)
```

#### Docker Sandbox

```python
agent = CodeAgent(
    tools=[],
    model=model,
    executor_type="docker"
)
```

### Security Controls

```python
agent = CodeAgent(
    tools=[],
    model=model,
    additional_authorized_imports=[
        'requests',      # Explicitly allowed
        'numpy.*',       # Allow numpy and all submodules
        'pandas',        # Data manipulation
        # Note: 'os', 'subprocess' are blocked by default
    ]
)
```

### Trust and Validation

```python
# Custom validation function
def validate_output(final_answer: str, agent_memory=None) -> bool:
    """Validate agent output format"""
    try:
        # Add your validation logic
        return len(final_answer) > 10
    except:
        return False

agent = CodeAgent(
    tools=[],
    model=model,
    final_answer_checks=[validate_output]
)
```

## Best Practices

### 1. Tool Design

```python
@tool
def well_designed_tool(input_param: str) -> str:
    """
    Clear, descriptive tool that does one thing well.
    
    Args:
        input_param: Specific description of what this parameter does
    """
    # Single responsibility
    # Clear error handling
    # Proper return types
    try:
        result = process_input(input_param)
        return f"Processed: {result}"
    except Exception as e:
        return f"Error: {str(e)}"
```

### 2. Agent Configuration

```python
# Production-ready agent setup
agent = CodeAgent(
    tools=carefully_selected_tools,
    model=InferenceClientModel(model_id="stable-model"),
    executor_type="e2b",  # Secure execution
    max_steps=10,         # Prevent infinite loops
    final_answer_checks=[output_validator],
    additional_authorized_imports=['requests', 'json']  # Minimal imports
)
```

### 3. Error Handling

```python
try:
    result = agent.run(user_input)
    # Log successful execution
    logger.info(f"Agent completed task: {result}")
except Exception as e:
    # Handle and log errors
    logger.error(f"Agent execution failed: {str(e)}")
    # Provide fallback response
    result = "I encountered an error processing your request."
```

### 4. Memory Management

```python
# Inspect agent execution
agent.run("Your task")

# Check execution logs
for step in agent.logs:
    print(f"Step {step['step_id']}: {step['action']}")

# Get chat-formatted memory
messages = agent.write_memory_to_messages()
```

## Integration Patterns

### 1. Web Application Integration

```python
from flask import Flask, request, jsonify
from smolagents import CodeAgent, InferenceClientModel

app = Flask(__name__)

# Initialize agent
model = InferenceClientModel()
agent = CodeAgent(tools=[], model=model, add_base_tools=True)

@app.route('/agent', methods=['POST'])
def run_agent():
    user_input = request.json.get('message')
    
    try:
        result = agent.run(user_input, reset=False)  # Maintain conversation
        return jsonify({
            'success': True,
            'result': str(result),
            'steps': len(agent.logs)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
```

### 2. Background Task Processing

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AgentWorker:
    def __init__(self):
        self.agent = CodeAgent(
            tools=[],
            model=InferenceClientModel(),
            add_base_tools=True
        )
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def process_task(self, task_data):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            self.agent.run,
            task_data['message']
        )
        return result
    
    async def batch_process(self, tasks):
        results = await asyncio.gather(
            *[self.process_task(task) for task in tasks]
        )
        return results
```

### 3. Event-Driven Architecture

```python
import json
from typing import Dict, Any

class AgentEventProcessor:
    def __init__(self, config: Dict[str, Any]):
        self.agents = {}
        self.setup_agents(config)
    
    def setup_agents(self, config):
        model = InferenceClientModel()
        
        for agent_config in config['agents']:
            agent = CodeAgent(
                tools=self.load_tools(agent_config['tools']),
                model=model,
                name=agent_config['name']
            )
            self.agents[agent_config['name']] = agent
    
    def handle_event(self, event_type: str, event_data: Dict[str, Any]):
        agent_name = event_data.get('agent', 'default')
        agent = self.agents.get(agent_name)
        
        if agent:
            return agent.run(event_data['message'])
        else:
            raise ValueError(f"Unknown agent: {agent_name}")
```

### 4. MK-XII SSH Deployment Workflow

```python
import subprocess
import requests
from pathlib import Path

class MKXIISmolagentsDeploymentWorkflow:
    """
    MK-XII SSH deployment workflow for smolagents applications
    Based on Copilot SSH Agent specifications with MK-XII methodology:
    
    CORE RULES:
    - Function over form
    - Working code over perfect code  
    - Less is more
    
    CONSTRAINTS:
    - Always try to do the LEAST possible amount of work
    - Think More, Code Less
    - Always update codebase inventory first
    - NEVER change server configuration
    - ONLY when FINISHED: git add, commit, push
    - SSH to brandynette@192.168.0.72 for git pull only
    - Check deployment at https://fickdichselber.com/
    - Interactive sudo password may be required
    - DEPLOYMENT DISABLED - MK-XII Development Branch
    """
    
    def __init__(self, remote_host="192.168.0.72", remote_user="brandynette"):
        self.remote_host = remote_host
        self.remote_user = remote_user
        self.remote_path = "/home/brandynette/web/fickdichselber.com/js-bambisleep-church"
        self.check_url = "https://fickdichselber.com/"
        self.deployment_enabled = False  # MK-XII Development Branch      def deploy_agent_changes(self, commit_message: str):
        """
        MK-XII deployment workflow for smolagents integration
        
        CRITICAL: Follow MK-XII Copilot SSH Agent workflow:
        1. Think before doing (minimal work principle)
        2. Update codebase inventory
        3. Git add/commit/push (ONLY when finished)
        4. SSH pull on remote (ONLY git pull allowed)
        5. Verify deployment via CURL
        
        STATUS: DEPLOYMENT DISABLED - MK-XII Development Branch
        """
        if not self.deployment_enabled:
            return {
                "success": False, 
                "message": "DEPLOYMENT DISABLED - MK-XII Development Branch",
                "action": "Development mode active - changes staged locally only"
            }
        
        try:
            # MK-XII Phase 1: IMAGINE (Think More, Code Less)
            self.imagine_deployment_requirements()
            
            # MK-XII Phase 2: CREATION (Minimal implementation)
            self.update_codebase_inventory()
            self.git_add_commit_push(commit_message)
            self.ssh_pull_remote()
            
            # MK-XII Phase 3: COMPACT (Verify and cleanup)
            self.verify_deployment()
            
            return {"success": True, "message": "MK-XII deployment completed successfully"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def imagine_deployment_requirements(self):
        """IMAGINE: What's the absolute minimum needed for deployment?"""
        # Check if changes are actually needed
        if not self.has_meaningful_changes():
            raise Exception("No meaningful changes detected - deployment not needed")
        
        # Verify all tasks are complete
        if not self.all_tasks_complete():
            raise Exception("Incomplete tasks found - finish before deployment")
    
    def all_tasks_complete(self):
        """Check if all tasks in .tasks/ are 100% complete"""
        tasks_dir = Path(".tasks")
        if not tasks_dir.exists():
            return True
        
        for task_file in tasks_dir.glob("*.task.md"):
            content = task_file.read_text()
            if "[100%]" not in content:
                return False
        return True
    
    def update_codebase_inventory(self):
        """Update .github/codebase-inventory.md with smolagents integration status"""
        inventory_path = Path(".github/codebase-inventory.md")
        if inventory_path.exists():
            # Update smolagents integration status
            content = inventory_path.read_text()
            # Add smolagents integration tracking
            updated_content = content.replace(
                "### Configuration [100%]",
                "### Configuration [100%]\n- `smolagents/` - Agent integration modules [100%]"
            )
            inventory_path.write_text(updated_content)
    
    def git_add_commit_push(self, commit_message: str):
        """Execute git workflow: add, commit, push"""
        commands = [
            ["git", "add", "."],
            ["git", "commit", "-m", f"copilot: {commit_message}"],
            ["git", "push"]
        ]
        
        for cmd in commands:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Git command failed: {' '.join(cmd)}\n{result.stderr}")
    
    def ssh_pull_remote(self):
        """SSH to remote server and pull latest changes"""
        ssh_command = [
            "ssh", f"{self.remote_user}@{self.remote_host}",
            f"cd {self.remote_path} && git pull"
        ]
        
        result = subprocess.run(ssh_command, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"SSH pull failed: {result.stderr}")
    
    def verify_deployment(self):
        """Verify deployment by checking the live site"""
        try:
            response = requests.get(self.check_url, timeout=10)
            if response.status_code != 200:
                raise Exception(f"Site check failed with status: {response.status_code}")
        except requests.RequestException as e:
            raise Exception(f"Site verification failed: {str(e)}")

# Usage example
def deploy_smolagents_integration():
    """Deploy smolagents integration with MK-XII workflow"""
    workflow = MKXIISmolagentsDeploymentWorkflow()
    
    # MK-XII: Think More, Code Less
    # Check if deployment is actually needed
    if not workflow.deployment_enabled:
        print("🚫 DEPLOYMENT DISABLED - MK-XII Development Branch")
        print("📝 Changes staged locally for development")
        return {"success": False, "message": "Development mode active"}
    
    # Deploy with descriptive commit message
    result = workflow.deploy_agent_changes(
        "smolagents MK-XII integration with MCP framework support"
    )
    
    if result["success"]:
        print("✅ MK-XII Smolagents deployment successful")
    else:
        print(f"❌ Deployment failed: {result['error']}")
    
    return result
```

### 5. MK-XII MCP Framework Integration

```python
class MKXIIMCPSmolagentsIntegration:
    """
    MK-XII Integration between smolagents and MCP framework
    Using LMStudio orchestration model with minimal complexity
    
    CORE PRINCIPLES:
    - Function over form
    - Working code over perfect code
    - Less is more
    - Think More, Code Less
    """
    
    def __init__(self):
        # MK-XII: Minimal configuration
        self.lmstudio_endpoint = "http://192.168.0.69:7777/v1"
        self.orchestration_model = "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0"
        self.deployment_enabled = False  # MK-XII Development Branch
        self.setup_mcp_agents()
    
    def setup_mcp_agents(self):
        """Setup smolagents with MCP orchestration - MK-XII minimal approach"""
        from smolagents import CodeAgent, InferenceClientModel
        
        # MK-XII: One model, one purpose
        mcp_model = InferenceClientModel(
            base_url=self.lmstudio_endpoint,
            model_id=self.orchestration_model,
            api_key="lm-studio"
        )
        
        # MK-XII: Minimal agent setup
        self.content_agent = CodeAgent(
            tools=[],  # MCP framework manages tools
            model=mcp_model,
            name="mk_xii_content_agent",
            description="MK-XII content discovery with MCP tools",
            add_base_tools=True  # Less is more
        )
    
    def mk_xii_orchestrate_content_discovery(self, search_terms: str):
        """MK-XII MCP orchestration for content discovery"""
        
        # IMAGINE: What's the minimal approach?
        if not search_terms.strip():
            return {"error": "No search terms provided"}
        
        # CREATION: Use MCP orchestration for tool selection
        prompt = f"""
        MK-XII TASK: Find bambisleep content for: {search_terms}
        
        CONSTRAINTS:
        - Function over form: Get working results fast
        - Working code over perfect code: Simple approach preferred
        - Less is more: Minimal tool usage
        
        Use available tools to:
        1. Search for relevant content
        2. Extract key information
        3. Return structured results
        
        STOP when basic requirements are met. Don't over-engineer.
        """
        
        # COMPACT: Return minimal viable result
        try:
            result = self.content_agent.run(prompt)
            return {
                "success": True,
                "result": result,
                "methodology": "MK-XII: Function over form"
            }
        except Exception as e:
            # MK-XII: Simple error handling
            return {
                "success": False,
                "error": str(e),
                "fallback": "Use manual search as backup"
            }
    
    def deploy_with_mk_xii_mcp_integration(self):
        """Deploy smolagents with MK-XII MCP integration"""
        from .mk_xii_deployment import MKXIISmolagentsDeploymentWorkflow
        
        if not self.deployment_enabled:
            return {
                "success": False,
                "message": "DEPLOYMENT DISABLED - MK-XII Development Branch",
                "status": "MCP integration ready for development testing"
            }
        
        workflow = MKXIISmolagentsDeploymentWorkflow()
        
        # Test MCP integration first (Think More, Code Less)
        test_result = self.mk_xii_orchestrate_content_discovery("bambi sleep test")
        
        if test_result.get("success"):
            # Deploy if MCP integration works
            return workflow.deploy_agent_changes(
                "smolagents MK-XII MCP framework integration with minimal complexity"
            )
        else:
            raise Exception("MK-XII MCP integration test failed - fix before deployment")

# MK-XII Usage Example
def mk_xii_mcp_integration_example():
    """Example of MK-XII MCP integration with smolagents"""
    
    # IMAGINE: What's the simplest approach?
    integration = MKXIIMCPSmolagentsIntegration()
    
    # CREATION: Test basic functionality
    result = integration.mk_xii_orchestrate_content_discovery("bambi sleep relaxation")
    
    # COMPACT: Use result as-is, don't over-optimize
    if result.get("success"):
        print("✅ MK-XII MCP integration working")
        return result
    else:
        print(f"❌ MK-XII MCP integration failed: {result.get('error')}")
        return None
```

## Troubleshooting

### Common Issues

1. **Import Errors**

   ```python
   # Solution: Add to authorized imports
   agent = CodeAgent(
       additional_authorized_imports=['missing_module']
   )
   ```

2. **Memory Issues**

   ```python
   # Solution: Reset agent memory
   agent.run("New task", reset=True)
   ```

3. **Tool Loading Failures**

   ```python
   # Solution: Check trust_remote_code setting
   tool = load_tool("repo/tool", trust_remote_code=True)
   ```

4. **Model Connection Issues**

   ```python
   # Solution: Verify API keys and model availability
   import os
   print(f"HF_TOKEN set: {'HF_TOKEN' in os.environ}")
   ```

### Debugging

```python
# Enable verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Inspect agent state
print(f"Agent tools: {[tool.name for tool in agent.tools]}")
print(f"Agent memory: {len(agent.logs)} steps")

# Check execution logs
for i, log in enumerate(agent.logs):
    print(f"Step {i}: {log.get('action', 'Unknown')}")
```

### Performance Optimization

```python
# Optimize for performance
agent = CodeAgent(
    tools=minimal_tool_set,      # Reduce tool count
    model=InferenceClientModel(  # Use fast model
        model_id="fast-model"
    ),
    max_steps=5,                 # Limit steps
    executor_type="local"        # Skip sandbox overhead for trusted code
)
```

## Advanced Topics

### Custom Agent Types

```python
from smolagents import Agent

class CustomAgent(Agent):
    def __init__(self, custom_param, **kwargs):
        super().__init__(**kwargs)
        self.custom_param = custom_param
    
    def run(self, task, **kwargs):
        # Custom execution logic
        preprocessed_task = self.preprocess(task)
        result = super().run(preprocessed_task, **kwargs)
        return self.postprocess(result)
    
    def preprocess(self, task):
        return f"[CUSTOM] {task}"
    
    def postprocess(self, result):
        return f"Processed: {result}"
```

### Tool Collections

```python
class ProjectToolCollection:
    def __init__(self):
        self.tools = []
        self.setup_tools()
    
    def setup_tools(self):
        # Add project-specific tools
        self.tools.extend([
            self.create_database_tool(),
            self.create_api_tool(),
            self.create_notification_tool()
        ])
    
    def create_database_tool(self):
        @tool
        def query_database(sql: str) -> str:
            # Database query implementation
            pass
        return query_database
    
    def get_tools(self):
        return self.tools
```

## Model Context Protocol (MCP) Integration

### MCP Architecture Overview

Smolagents integrates with MCP following a client-server architecture:

- **Hosts**: LLM applications (smolagents) that initiate connections
- **Clients**: Maintain 1:1 connections with MCP servers
- **Servers**: Provide context, tools, and prompts to clients

### MCP Message Format

Uses **JSON-RPC 2.0** as wire format:

```python
# Request format
{
  "jsonrpc": "2.0",
  "id": "number | string",
  "method": "string", 
  "params": "object?"
}

# Response format
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

### MCP Transport Types

#### 1. Standard Input/Output (stdio)

```python
from smolagents import ToolCollection

# For local integrations and command-line tools
server_params = {
    "command": "uvx",
    "args": ["--quiet", "mcp-server-package"],
    "env": {"UV_PYTHON": "3.12"}
}

with ToolCollection.from_mcp(server_params, trust_remote_code=True) as tools:
    agent = CodeAgent(tools=list(tools.tools), model=model)
```

#### 2. Streamable HTTP

```python
# For web integrations and stateful sessions
http_params = {
    "url": "http://localhost:8000/mcp",
    "transport": "streamable-http"
}

with ToolCollection.from_mcp(http_params, trust_remote_code=True) as tools:
    agent = CodeAgent(tools=list(tools.tools), model=model)
```

### MCP Security Implementation

```python
class SecureMCPIntegration:
    def __init__(self):
        self.security_config = {
            "validate_origins": True,
            "require_tls": True,
            "check_message_size": True,
            "audit_tool_usage": True
        }
    
    def validate_mcp_message(self, message):
        """Validate incoming MCP messages"""
        # Check JSON-RPC format
        if not all(key in message for key in ["jsonrpc", "method"]):
            raise ValueError("Invalid JSON-RPC format")
        
        # Validate message size
        if len(str(message)) > 1024 * 1024:  # 1MB limit
            raise ValueError("Message too large")
        
        return True
    
    def create_secure_agent(self, mcp_params):
        """Create agent with security controls"""
        # Validate connection parameters
        if not self.validate_connection_params(mcp_params):
            raise ValueError("Invalid MCP connection parameters")
        
        with ToolCollection.from_mcp(mcp_params, trust_remote_code=True) as tools:
            # Filter tools based on security policy
            safe_tools = self.filter_safe_tools(tools.tools)
            
            return CodeAgent(
                tools=safe_tools,
                model=InferenceClientModel(),
                executor_type="e2b"  # Secure execution
            )
```

### LMStudio MCP Framework Orchestration

```python
class LMStudioMCPOrchestrator:
    """
    Advanced MCP orchestration using LMStudio reasoning model
    """
    
    def __init__(self):
        self.endpoint = "http://192.168.0.69:7777/v1"
        self.model = "llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0"
        self.client = self.setup_client()
    
    def setup_client(self):
        from openai import OpenAI
        return OpenAI(
            base_url=self.endpoint,
            api_key="lm-studio"
        )
    
    def orchestrate_mcp_workflow(self, task_description, available_tools):
        """Let AI reason about MCP tool orchestration"""
        
        # Define MCP tool schema
        mcp_tools = self.convert_to_mcp_schema(available_tools)
        
        # Multi-turn orchestration
        messages = [
            {
                "role": "system",
                "content": """You are an MCP orchestration agent. Analyze the task and 
                determine the optimal sequence of MCP tool calls to complete it efficiently.
                Use structured reasoning and return execution plans as JSON."""
            },
            {
                "role": "user", 
                "content": f"Task: {task_description}\nAvailable MCP tools: {mcp_tools}"
            }
        ]
        
        # Get orchestration plan with structured output
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "mcp_execution_plan",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "steps": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "tool_name": {"type": "string"},
                                        "parameters": {"type": "object"},
                                        "reasoning": {"type": "string"}
                                    }
                                }
                            },
                            "expected_outcome": {"type": "string"}
                        }
                    }
                }
            }
        )
        
        plan = json.loads(response.choices[0].message.content)
        return self.execute_mcp_plan(plan)
    
    def execute_mcp_plan(self, execution_plan):
        """Execute the MCP orchestration plan"""
        results = []
        
        for step in execution_plan["steps"]:
            try:
                # Execute MCP tool call
                result = self.call_mcp_tool(
                    step["tool_name"], 
                    step["parameters"]
                )
                
                results.append({
                    "step": step,
                    "result": result,
                    "status": "success"
                })
                
            except Exception as e:
                results.append({
                    "step": step,
                    "error": str(e),
                    "status": "failed"
                })
                break  # Stop on first failure
        
        return {
            "execution_plan": execution_plan,
            "results": results,
            "overall_status": "success" if all(r["status"] == "success" for r in results) else "failed"
        }
    
    def convert_to_mcp_schema(self, tools):
        """Convert smolagents tools to MCP schema format"""
        mcp_schema = []
        
        for tool in tools:
            mcp_tool = {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": {
                    "type": "object",
                    "properties": getattr(tool, 'inputs', {}),
                    "required": getattr(tool, 'required_inputs', [])
                }
            }
            mcp_schema.append(mcp_tool)
        
        return mcp_schema
```

## MK-XII Integration

### Core Methodology: KEEP IT SIMPLE => 3 STEPS AGENT LOOP | MK-XII

Smolagents integration with MK-XII follows the **Function over form, Working code over perfect code, Less is more** philosophy.

#### 1. IMAGINE (Planning & Solutions) - **DO 3 TIMES**

**First IMAGINE Round:**

- Fetch `.tasks/<build_name.task>.md` tasks [IF] <doesn't_exist> ignore
- What's the absolute minimum I need to write?
- What's the minimal viable code approach?
- What must I avoid touching entirely?
- Can I solve this with existing code or tools?

**Second IMAGINE Round:**

- Fetch required `.github/codebase-inventory.md` files
- What code structure will I use with the least words?
- What files do I need to touch to keep coding to a minimum?
- What configurations do I need to know to successfully implement this?
- What is the least amount of work I can do to get this done correctly?
- Create a `.tasks/<build_name.task>.md` file with task description and requirements, add [0%]

**Third IMAGINE Round:**

- **RULE: Think More, Code Less**
- Always try to do the LEAST possible amount of work, even if it means thinking longer
- Final sanity check: Is this the laziest yet correct possible solution?
- Can I reuse something that already exists?
- Update `.tasks/<build_name.task>.md` with [%COMPLETION%] percentages for each item

#### 2. CREATION (Single Implementation) - **LOOP UNTIL 100 PERCENT BUILT ACHIEVED**

- Implement ONLY the solution from the 3x IMAGINE phase
- Write the absolute minimum code required
- One function, one purpose, done
- Check percentage of completion every iteration
- Update `.github/codebase-inventory.md` with full list of files with [%COMPLETION%] percentages
- If not 100% complete, go back to **Third IMAGINE Round**

#### 3. COMPACT (Consolidation & Cleanup) - **DO 3 TIMES**

- Review the code for unnecessary complexity
- Remove tests, demos, temp, new, old & junk files
- Remove dead code, comments, and console logs
- Ensure the code is as concise as possible
- Consolidate codebase structure
- Remove completed task from `.tasks/<build_name.task>.md`

**CRITICAL: When task is complete, STOP. Don't add features, don't improve, don't optimize.**

### MK-XII Smolagents Configuration

```python
from smolagents import CodeAgent, InferenceClientModel

# MK-XII Agent following minimal complexity principle
class MKXIIAgent:
    def __init__(self):
        # Function over form - minimal setup
        self.model = InferenceClientModel(
            base_url="http://192.168.0.69:7777/v1",
            model_id="llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0",
            api_key="lm-studio"
        )
        
        # Working code over perfect code
        self.agent = CodeAgent(
            tools=[],  # Start minimal, add only what's needed
            model=self.model,
            add_base_tools=True  # Less is more
        )
    
    def imagine_phase(self, task_description):
        """IMAGINE: Think More, Code Less"""
        # Check existing solutions first
        existing_solution = self.check_existing_tasks(task_description)
        if existing_solution:
            return existing_solution
        
        # Minimal viable approach
        return self.plan_minimal_implementation(task_description)
    
    def creation_phase(self, implementation_plan):
        """CREATION: Single Implementation Loop"""
        while not self.is_100_percent_complete(implementation_plan):
            result = self.agent.run(implementation_plan['next_step'])
            implementation_plan = self.update_progress(implementation_plan, result)
        return implementation_plan
    
    def compact_phase(self, completed_implementation):
        """COMPACT: Consolidation & Cleanup"""
        # Remove unnecessary complexity
        cleaned_code = self.remove_dead_code(completed_implementation)
        # Consolidate structure
        final_result = self.consolidate_structure(cleaned_code)
        # STOP - don't add features
        return final_result
```

### MK-XII Integration Patterns

#### Task-Driven Development

```python
def mk_xii_task_workflow():
    """
    MK-XII task workflow integration with smolagents
    Always check .tasks/ directory first
    """
    import os
    from pathlib import Path
    
    # Check for existing tasks
    tasks_dir = Path(".tasks")
    if tasks_dir.exists():
        for task_file in tasks_dir.glob("*.task.md"):
            task_content = task_file.read_text()
            if "[0%]" in task_content or "[ ]" in task_content:
                return process_existing_task(task_file)
    
    # Create new task if none exist
    return create_minimal_task()

def process_existing_task(task_file):
    """Process existing task following MK-XII methodology"""
    agent = MKXIIAgent()
    
    # IMAGINE: Read task requirements
    task_content = task_file.read_text()
    plan = agent.imagine_phase(task_content)
    
    # CREATION: Implement with progress tracking
    result = agent.creation_phase(plan)
    
    # COMPACT: Clean up and finalize
    final_result = agent.compact_phase(result)
    
    # Update task completion
    update_task_completion(task_file, "[100%]")
    
    return final_result
```

## MK-XII Configuration Summary

### Current Development Environment

**Status**: DEPLOYMENT DISABLED - MK-XII Development Branch

**Configuration**:

- **LMStudio Endpoint**: `http://192.168.0.69:7777/v1/chat/completions`
- **Model**: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`
- **SSH Target**: `brandynette@192.168.0.72`
- **Deployment Path**: `/home/brandynette/web/fickdichselber.com/js-bambisleep-church`
- **Verification URL**: `https://fickdichselber.com/`

### MK-XII Integration Checklist

- ✅ **Core Rules Implemented**: Function over form, working code over perfect code, less is more
- ✅ **3-Step Agent Loop**: IMAGINE → CREATION → COMPACT methodology
- ✅ **Task Management**: `.tasks/` directory with completion tracking
- ✅ **Codebase Inventory**: `.github/codebase-inventory.md` with progress percentages
- ✅ **MCP Integration**: LMStudio orchestration with reasoning model
- ✅ **SSH Workflow**: Secure deployment constraints with git-only access
- ✅ **Development Mode**: Deployment disabled for active development

When development is complete and all tasks show [100%], deployment can be re-enabled by setting `deployment_enabled = True` in the workflow configuration.

---

*This documentation follows MK-XII principles: Function over form, working code over perfect code, less is more.*
