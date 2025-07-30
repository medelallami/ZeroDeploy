import os
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_env_var(name: str, default: Any = None) -> Any:
    """
    Get environment variable with fallback to default value.
    
    Args:
        name (str): Environment variable name
        default (Any, optional): Default value if not found
        
    Returns:
        Any: Environment variable value or default
    """
    return os.getenv(name, default)

def validate_ip_address(ip: str) -> bool:
    """
    Validate if a string is a valid IP address.
    
    Args:
        ip (str): IP address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not ip:
        return False
        
    # Simple validation for IPv4
    parts = ip.split('.')
    if len(parts) != 4:
        return False
        
    for part in parts:
        try:
            num = int(part)
            if num < 0 or num > 255:
                return False
        except ValueError:
            return False
            
    return True

def sanitize_container_name(name: str) -> str:
    """
    Sanitize container name for use in domain names.
    
    Args:
        name (str): Container name
        
    Returns:
        str: Sanitized name
    """
    # Remove leading slash if present
    if name.startswith('/'):
        name = name[1:]
        
    # Replace invalid characters with hyphens
    invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', ' ']
    for char in invalid_chars:
        name = name.replace(char, '-')
        
    # Ensure name is lowercase and doesn't start or end with hyphen
    name = name.lower().strip('-')
    
    # Limit length to 63 characters (DNS label limit)
    if len(name) > 63:
        name = name[:63]
        
    return name

def format_log_message(message: str, level: str = "INFO") -> Dict[str, str]:
    """
    Format a log message for consistent logging.
    
    Args:
        message (str): Log message
        level (str, optional): Log level
        
    Returns:
        Dict[str, str]: Formatted log message
    """
    return {
        "level": level,
        "message": message,
        "timestamp": logging.Formatter().formatTime(logging.LogRecord("name", logging.INFO, "", 0, "", (), None))
    }