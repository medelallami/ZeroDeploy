import docker
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_running_containers(remote_host: str = None) -> List[Dict[str, Any]]:
    """
    Get a list of all running Docker containers with their relevant information.
    
    Args:
        remote_host (str, optional): Remote Docker host URL (e.g., tcp://192.168.1.100:2375)
    
    Returns:
        List[Dict[str, Any]]: List of container information dictionaries
    """
    try:
        # Initialize Docker client
        if remote_host:
            client = docker.DockerClient(base_url=remote_host)
            logger.info(f"Connected to remote Docker host: {remote_host}")
        else:
            client = docker.from_env()
        
        # Get all running containers
        containers = client.containers.list()
        
        container_info = []
        
        for container in containers:
            # Skip system containers or those with specific labels
            if should_skip_container(container):
                continue
                
            # Get container details
            details = container.attrs
            
            # Extract container name (remove leading slash)
            name = details['Name']
            if name.startswith('/'):
                name = name[1:]
                
            # Get container IP address (from first network)
            ip_address = ""
            networks = details.get('NetworkSettings', {}).get('Networks', {})
            if networks:
                # Get the first network's IP
                first_network = next(iter(networks.values()))
                ip_address = first_network.get('IPAddress', '')
            
            # Get exposed ports
            ports = []
            port_bindings = details.get('NetworkSettings', {}).get('Ports', {})
            if port_bindings:
                for container_port, host_bindings in port_bindings.items():
                    if host_bindings:  # Only include ports that are actually exposed
                        protocol = container_port.split('/')[-1]
                        port_num = container_port.split('/')[0]
                        ports.append({
                            'container_port': port_num,
                            'protocol': protocol,
                            'host_port': host_bindings[0]['HostPort'] if host_bindings else None
                        })
            
            # Check if DNS should be enabled (via label)
            labels = details.get('Config', {}).get('Labels', {})
            dns_enabled = labels.get('subdomain.enabled', 'true').lower() == 'true'
            
            # Create container info dictionary
            container_data = {
                'id': container.id,
                'name': name,
                'image': details.get('Config', {}).get('Image', ''),
                'status': details.get('State', {}).get('Status', ''),
                'ip_address': ip_address,
                'ports': ports,
                'dns_enabled': dns_enabled,
                'created': details.get('Created', ''),
                'labels': labels
            }
            
            container_info.append(container_data)
            
        return container_info
        
    except docker.errors.DockerException as e:
        logger.error(f"Docker error: {str(e)}")
        raise Exception(f"Failed to connect to Docker daemon: {str(e)}")
    except Exception as e:
        logger.error(f"Error scanning containers: {str(e)}")
        raise Exception(f"Error scanning containers: {str(e)}")

def should_skip_container(container) -> bool:
    """
    Determine if a container should be skipped in DNS configuration.
    
    Args:
        container: Docker container object
        
    Returns:
        bool: True if container should be skipped, False otherwise
    """
    # Get container labels
    labels = container.attrs.get('Config', {}).get('Labels', {})
    
    # Skip if explicitly disabled via label
    if labels.get('subdomain.enabled', 'true').lower() == 'false':
        return True
        
    # Skip system containers (could be expanded based on needs)
    system_containers = ['zeronsd', 'dns-manager']
    name = container.attrs.get('Name', '')
    if name.startswith('/'):
        name = name[1:]
        
    if name in system_containers:
        return True
        
    return False

def get_container_by_name(name: str, remote_host: str = None) -> Optional[Dict[str, Any]]:
    """
    Get container information by name.
    
    Args:
        name (str): Container name to search for
        remote_host (str, optional): Remote Docker host URL (e.g., tcp://192.168.1.100:2375)
        
    Returns:
        Optional[Dict[str, Any]]: Container information or None if not found
    """
    containers = get_running_containers(remote_host)
    for container in containers:
        if container['name'] == name:
            return container
    return None