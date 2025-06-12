#!/usr/bin/env python3
"""
Enhanced MCP Fetch Server for BambiSleep Church
Based on the official MCP fetch server with bambisleep-specific enhancements
"""

import asyncio
import argparse
import json
import sys
from typing import Tuple, Optional
from urllib.parse import urlparse, urlunparse

import httpx
import markdownify
from bs4 import BeautifulSoup

# Default user agents
DEFAULT_USER_AGENT_AUTONOMOUS = "BambiSleep-Church-MCP/1.0 (Autonomous; +https://github.com/modelcontextprotocol/servers)"
DEFAULT_USER_AGENT_MANUAL = "BambiSleep-Church-MCP/1.0 (User-Specified; +https://github.com/modelcontextprotocol/servers)"

class FetchError(Exception):
    """Custom exception for fetch errors"""
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code
        super().__init__(message)

def extract_content_from_html(html: str) -> str:
    """Extract readable content from HTML and convert to markdown"""
    try:
        # Use BeautifulSoup for better HTML parsing
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Try to convert to markdown for better structure
        try:
            markdown = markdownify.markdownify(str(soup), heading_style="ATX")
            return markdown if markdown.strip() else text
        except:
            return text
            
    except Exception:
        # Fallback: just return cleaned text
        try:
            soup = BeautifulSoup(html, 'html.parser')
            return soup.get_text()
        except:
            return html

def get_robots_txt_url(url: str) -> str:
    """Get robots.txt URL for a given URL"""
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, "/robots.txt", "", "", ""))

async def check_robots_txt(url: str, user_agent: str, proxy_url: Optional[str] = None) -> bool:
    """Check if URL is allowed by robots.txt"""
    try:
        robots_url = get_robots_txt_url(url)
        
        # Configure client
        client_kwargs = {"timeout": 10, "follow_redirects": True}
        if proxy_url:
            client_kwargs["proxies"] = {"http://": proxy_url, "https://": proxy_url}
        
        async with httpx.AsyncClient(**client_kwargs) as client:
            try:
                response = await client.get(robots_url, headers={"User-Agent": user_agent})
                
                if response.status_code == 200:
                    robots_txt = response.text
                    # Simple robots.txt parsing
                    lines = robots_txt.lower().split('\n')
                    current_ua = None
                    
                    for line in lines:
                        line = line.strip()
                        if line.startswith('user-agent:'):
                            current_ua = line.split(':', 1)[1].strip()
                        elif line.startswith('disallow:') and current_ua:
                            if current_ua == '*' or user_agent.lower() in current_ua:
                                disallowed = line.split(':', 1)[1].strip()
                                if disallowed and (disallowed == '/' or url.endswith(disallowed)):
                                    return False
                
                return True
                
            except httpx.HTTPError:
                return True  # If can't fetch robots.txt, assume allowed
                
    except Exception:
        return True  # Default to allowed if any error

async def fetch_url(
    url: str, 
    user_agent: str, 
    force_raw: bool = False, 
    proxy_url: Optional[str] = None,
    max_retries: int = 3
) -> Tuple[str, str]:
    """Fetch URL and return content and status prefix"""
    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }
    
    for attempt in range(max_retries):
        try:
            # Configure client
            client_kwargs = {"timeout": 30, "follow_redirects": True}
            if proxy_url:
                client_kwargs["proxies"] = {"http://": proxy_url, "https://": proxy_url}
            
            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code >= 400:
                    raise FetchError(
                        f"HTTP {response.status_code}: {response.reason_phrase}",
                        response.status_code
                    )
                
                content = response.text
                content_type = response.headers.get("content-type", "").lower()
                
                # Detect if it's HTML content
                is_html = (
                    "text/html" in content_type or
                    "<html" in content[:200].lower() or
                    "<!doctype html" in content[:200].lower()
                )
                
                if is_html and not force_raw:
                    processed_content = extract_content_from_html(content)
                    return processed_content, ""
                else:
                    prefix = ""
                    if not is_html:
                        prefix = f"Content type {content_type} - raw content:\n"
                    return content, prefix
                    
        except httpx.HTTPError as e:
            if attempt == max_retries - 1:
                raise FetchError(f"Failed to fetch {url}: {str(e)}")
            await asyncio.sleep(1 * (attempt + 1))
        except Exception as e:
            if attempt == max_retries - 1:
                raise FetchError(f"Unexpected error fetching {url}: {str(e)}")
            await asyncio.sleep(1 * (attempt + 1))
    
    raise FetchError(f"Failed to fetch {url} after {max_retries} attempts")

def detect_bambisleep_content(content: str, url: str) -> dict:
    """Detect and extract bambisleep-specific content"""
    metadata = {
        "is_bambisleep": False,
        "content_type": "unknown",
        "creator": None,
        "session_type": None,
        "tags": []
    }
    
    url_lower = url.lower()
    content_lower = content.lower()
    
    # Check if it's bambisleep-related
    bambisleep_indicators = [
        "bambi sleep", "bambisleep", "bambi", "hypnosis", "hypno",
        "trance", "conditioning", "bimbo", "transformation"
    ]
    
    if any(indicator in url_lower or indicator in content_lower for indicator in bambisleep_indicators):
        metadata["is_bambisleep"] = True
        
        # Detect content type
        if "bambisleep.info" in url_lower:
            metadata["content_type"] = "wiki"
        elif "bambicloud" in url_lower:
            metadata["content_type"] = "audio_platform" 
        elif "hypnotube" in url_lower:
            metadata["content_type"] = "video_platform"
        elif any(ext in url_lower for ext in ['.mp3', '.wav', '.m4a']):
            metadata["content_type"] = "audio_file"
        elif any(ext in url_lower for ext in ['.mp4', '.webm', '.mov']):
            metadata["content_type"] = "video_file"
        
        # Extract creator information
        creator_patterns = [
            "bambi prime", "bambi4eva", "bellmar", "platinumpuppets", "wednesday"
        ]
        
        for pattern in creator_patterns:
            if pattern in content_lower:
                metadata["creator"] = pattern
                break
        
        # Extract session type
        session_types = ["induction", "conditioning", "reinforcement", "trigger", "deepener"]
        for session_type in session_types:
            if session_type in content_lower:
                metadata["session_type"] = session_type
                break
        
        # Extract tags
        tag_indicators = ["tag:", "tags:", "category:", "series:"]
        for indicator in tag_indicators:
            if indicator in content_lower:
                idx = content_lower.find(indicator)
                if idx != -1:
                    line = content[idx:idx+100].split('\n')[0]
                    tags = [t.strip() for t in line.split(',')]
                    metadata["tags"].extend(tags)
    
    return metadata

async def process_fetch_request(request_data: dict) -> dict:
    """Process a single fetch request and return structured response"""
    try:
        url = request_data.get("url")
        if not url:
            raise FetchError("URL is required", 400)
        
        max_length = request_data.get("max_length", 5000)
        start_index = request_data.get("start_index", 0)
        raw = request_data.get("raw", False)
        ignore_robots = request_data.get("ignore_robots", False)
        user_agent = request_data.get("user_agent", DEFAULT_USER_AGENT_AUTONOMOUS)
        proxy_url = request_data.get("proxy_url")
        
        # Check robots.txt if enabled
        if not ignore_robots:
            robots_allowed = await check_robots_txt(url, user_agent, proxy_url)
            if not robots_allowed:
                return {
                    "success": False,
                    "error": "Robots.txt disallows fetching this URL",
                    "code": 403
                }
        
        # Fetch the content
        content, prefix = await fetch_url(url, user_agent, raw, proxy_url)
        
        # Apply start_index and max_length
        original_length = len(content)
        if start_index >= original_length:
            content = "No more content available."
        else:
            end_index = min(start_index + max_length, original_length)
            content = content[start_index:end_index]
            
            # Add truncation notice if needed
            if end_index < original_length:
                remaining = original_length - end_index
                content += f"\n\n[Content truncated. {remaining} characters remaining. Use start_index={end_index} to continue.]"
        
        # Detect bambisleep content
        bambisleep_metadata = detect_bambisleep_content(content, url)
        
        return {
            "success": True,
            "url": url,
            "content": content,
            "prefix": prefix,
            "length": len(content),
            "original_length": original_length,
            "truncated": start_index + max_length < original_length,
            "bambisleep_metadata": bambisleep_metadata,
            "status_code": 200
        }
        
    except FetchError as e:
        return {
            "success": False,
            "error": e.message,
            "code": e.code
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "code": 500
        }

async def run_standalone_server():
    """Run as standalone server reading JSON requests from stdin"""
    while True:
        try:
            # Read line from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break
                
            line = line.strip()
            if not line:
                continue
            
            # Parse JSON request
            try:
                request = json.loads(line)
            except json.JSONDecodeError as e:
                response = {
                    "success": False,
                    "error": f"Invalid JSON: {str(e)}",
                    "code": 400
                }
                print(json.dumps(response), flush=True)
                continue
            
            # Process request
            response = await process_fetch_request(request)
            
            # Send response
            print(json.dumps(response), flush=True)
            
        except EOFError:
            break
        except Exception as e:
            error_response = {
                "success": False,
                "error": f"Server error: {str(e)}",
                "code": 500
            }
            print(json.dumps(error_response), flush=True)

async def run_single_request(url: str, **kwargs):
    """Run a single fetch request and exit"""
    request_data = {"url": url, **kwargs}
    response = await process_fetch_request(request_data)
    print(json.dumps(response, indent=2))

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Enhanced MCP Fetch Server for BambiSleep Church"
    )
    parser.add_argument("--url", type=str, help="Single URL to fetch (non-server mode)")
    parser.add_argument("--user-agent", type=str, help="Custom User-Agent string")
    parser.add_argument("--ignore-robots", action="store_true", help="Ignore robots.txt")
    parser.add_argument("--proxy-url", type=str, help="Proxy URL")
    parser.add_argument("--max-length", type=int, default=5000, help="Max content length")
    parser.add_argument("--raw", action="store_true", help="Return raw content")
    parser.add_argument("--server", action="store_true", help="Run in server mode (default)")
    
    args = parser.parse_args()
    
    if args.url:
        # Single request mode
        kwargs = {
            "user_agent": args.user_agent,
            "ignore_robots": args.ignore_robots,
            "proxy_url": args.proxy_url,
            "max_length": args.max_length,
            "raw": args.raw
        }
        # Remove None values
        kwargs = {k: v for k, v in kwargs.items() if v is not None}
        
        asyncio.run(run_single_request(args.url, **kwargs))
    else:
        # Server mode (default)
        asyncio.run(run_standalone_server())

if __name__ == "__main__":
    main()
