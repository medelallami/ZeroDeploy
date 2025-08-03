import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default log file path
DEFAULT_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'dns_access.json')

def ensure_log_directory(log_file: str = DEFAULT_LOG_FILE) -> None:
    """
    Ensure the log directory exists.
    
    Args:
        log_file (str): Path to the log file
    """
    log_dir = os.path.dirname(log_file)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        logger.info(f"Created log directory: {log_dir}")

def log_dns_access(ip_address: str, domain: str, log_file: str = DEFAULT_LOG_FILE) -> None:
    """
    Log DNS access to a file.
    
    Args:
        ip_address (str): IP address that accessed the DNS
        domain (str): Domain that was accessed
        log_file (str, optional): Path to the log file
    """
    ensure_log_directory(log_file)
    
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "ip_address": ip_address,
        "domain": domain
    }
    
    try:
        # Load existing logs if file exists
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            except json.JSONDecodeError:
                logger.warning(f"Could not parse log file {log_file}, creating new file")
        
        # Add new log entry
        logs.append(log_entry)
        
        # Keep only the last 1000 entries to prevent file from growing too large
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        # Write logs back to file
        with open(log_file, 'w') as f:
            json.dump(logs, f)
            
        logger.debug(f"Logged DNS access from {ip_address} to {domain}")
    except Exception as e:
        logger.error(f"Failed to log DNS access: {str(e)}")

def get_recent_dns_accesses(count: int = 5, log_file: str = DEFAULT_LOG_FILE) -> List[Dict[str, Any]]:
    """
    Get the most recent DNS accesses.
    
    Args:
        count (int, optional): Number of recent accesses to return
        log_file (str, optional): Path to the log file
        
    Returns:
        List[Dict[str, Any]]: List of recent DNS accesses
    """
    if not os.path.exists(log_file):
        return []
    
    try:
        with open(log_file, 'r') as f:
            logs = json.load(f)
        
        # Sort logs by timestamp (newest first)
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Return only the requested number of logs
        return logs[:count]
    except Exception as e:
        logger.error(f"Failed to get recent DNS accesses: {str(e)}")
        return []