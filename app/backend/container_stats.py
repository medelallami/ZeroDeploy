import docker
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_container_stats(container_id: str, remote_host: str = None) -> Dict[str, Any]:
    """
    Get statistics for a specific container.
    
    Args:
        container_id (str): The ID of the container to get statistics for
        remote_host (str, optional): Remote Docker host URL (e.g., tcp://192.168.1.100:2375)
    
    Returns:
        Dict[str, Any]: Container statistics
    """
    try:
        # Initialize Docker client
        if remote_host:
            client = docker.DockerClient(base_url=remote_host)
            logger.info(f"Connected to remote Docker host: {remote_host}")
        else:
            client = docker.from_env()
        
        # Get container
        container = client.containers.get(container_id)
        
        # Get container stats
        stats = container.stats(stream=False)
        
        # Process CPU stats
        cpu_stats = stats.get('cpu_stats', {})
        precpu_stats = stats.get('precpu_stats', {})
        
        cpu_usage = cpu_stats.get('cpu_usage', {}).get('total_usage', 0)
        precpu_usage = precpu_stats.get('cpu_usage', {}).get('total_usage', 0)
        system_cpu_usage = cpu_stats.get('system_cpu_usage', 0)
        precpu_system_usage = precpu_stats.get('system_cpu_usage', 0)
        online_cpus = cpu_stats.get('online_cpus', 1)
        
        # Calculate CPU percentage
        cpu_percent = 0.0
        if system_cpu_usage > 0 and precpu_system_usage > 0:
            cpu_delta = cpu_usage - precpu_usage
            system_delta = system_cpu_usage - precpu_system_usage
            if system_delta > 0 and cpu_delta > 0:
                cpu_percent = (cpu_delta / system_delta) * online_cpus * 100.0
        
        # Process memory stats
        memory_stats = stats.get('memory_stats', {})
        memory_usage = memory_stats.get('usage', 0)
        memory_limit = memory_stats.get('limit', 1)
        memory_percent = (memory_usage / memory_limit) * 100.0 if memory_limit > 0 else 0
        
        # Process network stats
        networks = stats.get('networks', {})
        network_rx_bytes = 0
        network_tx_bytes = 0
        
        for interface, data in networks.items():
            network_rx_bytes += data.get('rx_bytes', 0)
            network_tx_bytes += data.get('tx_bytes', 0)
        
        # Process block I/O stats
        blkio_stats = stats.get('blkio_stats', {})
        io_service_bytes_recursive = blkio_stats.get('io_service_bytes_recursive', [])
        
        block_read = 0
        block_write = 0
        
        for io_stat in io_service_bytes_recursive:
            if io_stat.get('op') == 'Read':
                block_read += io_stat.get('value', 0)
            elif io_stat.get('op') == 'Write':
                block_write += io_stat.get('value', 0)
        
        # Format the stats
        formatted_stats = {
            'id': container_id,
            'name': container.name,
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'usage_percent': round(cpu_percent, 2),
                'online_cpus': online_cpus
            },
            'memory': {
                'usage': memory_usage,
                'limit': memory_limit,
                'usage_percent': round(memory_percent, 2)
            },
            'network': {
                'rx_bytes': network_rx_bytes,
                'tx_bytes': network_tx_bytes
            },
            'disk': {
                'read_bytes': block_read,
                'write_bytes': block_write
            }
        }
        
        return formatted_stats
        
    except docker.errors.NotFound:
        logger.error(f"Container {container_id} not found")
        raise Exception(f"Container {container_id} not found")
    except docker.errors.DockerException as e:
        logger.error(f"Docker error: {str(e)}")
        raise Exception(f"Failed to connect to Docker daemon: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting container stats: {str(e)}")
        raise Exception(f"Error getting container stats: {str(e)}")

def get_container_logs(container_id: str, lines: int = 100, remote_host: str = None) -> List[str]:
    """
    Get logs for a specific container.
    
    Args:
        container_id (str): The ID of the container to get logs for
        lines (int, optional): Number of log lines to retrieve. Defaults to 100.
        remote_host (str, optional): Remote Docker host URL (e.g., tcp://192.168.1.100:2375)
    
    Returns:
        List[str]: Container log lines
    """
    try:
        # Initialize Docker client
        if remote_host:
            client = docker.DockerClient(base_url=remote_host)
            logger.info(f"Connected to remote Docker host: {remote_host}")
        else:
            client = docker.from_env()
        
        # Get container
        container = client.containers.get(container_id)
        
        # Get container logs
        logs = container.logs(tail=lines, timestamps=True).decode('utf-8').splitlines()
        
        # Format logs with timestamps
        formatted_logs = []
        for log in logs:
            # Try to split timestamp and message
            parts = log.split(' ', 1)
            if len(parts) >= 2:
                timestamp, message = parts[0], parts[1]
                formatted_logs.append({
                    'timestamp': timestamp,
                    'message': message
                })
            else:
                formatted_logs.append({
                    'timestamp': '',
                    'message': log
                })
        
        return formatted_logs
        
    except docker.errors.NotFound:
        logger.error(f"Container {container_id} not found")
        raise Exception(f"Container {container_id} not found")
    except docker.errors.DockerException as e:
        logger.error(f"Docker error: {str(e)}")
        raise Exception(f"Failed to connect to Docker daemon: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting container logs: {str(e)}")
        raise Exception(f"Error getting container logs: {str(e)}")