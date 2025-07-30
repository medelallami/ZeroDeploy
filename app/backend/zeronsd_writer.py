import os
import toml
import docker
import logging
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default paths and settings
DEFAULT_CONFIG_TEMPLATE = "../config/config.template.toml"
DEFAULT_CONFIG_OUTPUT = "/app/config/config.toml"
DEFAULT_DOMAIN_SUFFIX = "vexinet.local"

def generate_config(
    containers: List[Dict[str, Any]],
    template_path: str = None,
    output_path: str = None,
    domain_suffix: str = None
) -> bool:
    """
    Generate ZeroNSD configuration file based on container information.
    
    Args:
        containers (List[Dict[str, Any]]): List of container information dictionaries
        template_path (str, optional): Path to template config file
        output_path (str, optional): Path to output config file
        domain_suffix (str, optional): Domain suffix to use for DNS entries
        
    Returns:
        bool: True if config was generated successfully, False otherwise
    """
    try:
        # Use default values if not provided
        template_path = template_path or os.getenv("CONFIG_TEMPLATE_PATH", DEFAULT_CONFIG_TEMPLATE)
        output_path = output_path or os.getenv("DNS_CONFIG_PATH", DEFAULT_CONFIG_OUTPUT)
        domain_suffix = domain_suffix or os.getenv("DOMAIN_SUFFIX", DEFAULT_DOMAIN_SUFFIX)
        
        # Load template if it exists, otherwise create a base config
        if os.path.exists(template_path):
            try:
                config = toml.load(template_path)
                logger.info(f"Loaded template from {template_path}")
            except Exception as e:
                logger.warning(f"Failed to load template: {str(e)}. Creating new config.")
                config = create_base_config(domain_suffix)
        else:
            logger.info(f"Template not found at {template_path}. Creating new config.")
            config = create_base_config(domain_suffix)
        
        # Ensure services section exists
        if "services" not in config:
            config["services"] = []
        else:
            # Clear existing services to rebuild them
            config["services"] = []
        
        # Add entries for each container
        for container in containers:
            # Skip containers that have DNS disabled
            if not container.get("dns_enabled", True):
                continue
                
            # Get container name and IP address
            name = container.get("name", "")
            ip_address = container.get("ip_address", "")
            
            # Skip if no IP address or name
            if not name or not ip_address:
                logger.warning(f"Skipping container with missing data: {name}")
                continue
                
            # Create DNS entry
            service_entry = {
                "name": f"{name}.{domain_suffix}",
                "type": "A",
                "address": ip_address
            }
            
            # Add to services list
            config["services"].append(service_entry)
            logger.info(f"Added DNS entry for {name}.{domain_suffix} -> {ip_address}")
        
        # Write config to file
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w") as f:
            toml.dump(config, f)
            
        logger.info(f"Generated ZeroNSD config at {output_path} with {len(config['services'])} services")
        return True
        
    except Exception as e:
        logger.error(f"Error generating config: {str(e)}")
        return False

def create_base_config(domain_suffix: str) -> Dict[str, Any]:
    """
    Create a base ZeroNSD configuration.
    
    Args:
        domain_suffix (str): Domain suffix to use
        
    Returns:
        Dict[str, Any]: Base configuration dictionary
    """
    return {
        "network": domain_suffix,
        "services": []
    }

def reload_zeronsd() -> bool:
    """
    Reload the ZeroNSD container to apply configuration changes.
    
    Returns:
        bool: True if reload was successful, False otherwise
    """
    try:
        # Initialize Docker client
        client = docker.from_env()
        
        # Find ZeroNSD container
        zeronsd_container = None
        containers = client.containers.list()
        
        for container in containers:
            if container.name == "zeronsd":
                zeronsd_container = container
                break
                
        if not zeronsd_container:
            logger.error("ZeroNSD container not found")
            return False
            
        # Restart container
        zeronsd_container.restart(timeout=10)
        logger.info("ZeroNSD container restarted successfully")
        return True
        
    except docker.errors.DockerException as e:
        logger.error(f"Docker error reloading ZeroNSD: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error reloading ZeroNSD: {str(e)}")
        return False