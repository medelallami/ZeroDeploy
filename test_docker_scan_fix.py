
import unittest
from unittest.mock import MagicMock, patch
import os
from app.backend.docker_scan import get_running_containers

class TestDockerScan(unittest.TestCase):
    @patch('app.backend.docker_scan.docker.from_env')
    def test_multiple_networks_ip_selection_with_env_var(self, mock_docker_from_env):
        # Set the environment variable to prefer 'network_a'
        os.environ['DOCKER_NETWORK'] = 'network_a'

        try:
            # Mock the Docker client and container
            mock_client = MagicMock()
            mock_container = MagicMock()

            # Setup container attributes with multiple networks
            # Put network_b first to ensure we don't just pick the first one
            mock_container.attrs = {
                'Name': '/test-container',
                'Config': {
                    'Image': 'nginx:latest',
                    'Labels': {}
                },
                'State': {'Status': 'running'},
                'Created': '2023-01-01T00:00:00Z',
                'NetworkSettings': {
                    'Networks': {
                        'network_b': {'IPAddress': '192.168.1.1'},
                        'network_a': {'IPAddress': '10.0.0.1'}
                    },
                    'Ports': {}
                }
            }

            # Mock the list method to return our container
            mock_client.containers.list.return_value = [mock_container]
            mock_docker_from_env.return_value = mock_client

            # Run the scan
            containers = get_running_containers()

            # Check the result
            self.assertEqual(len(containers), 1)
            container = containers[0]

            print(f"Selected IP (with env var): {container['ip_address']}")
            # It should now pick network_a's IP because of DOCKER_NETWORK env var
            self.assertEqual(container['ip_address'], '10.0.0.1')

        finally:
            # Clean up env var
            del os.environ['DOCKER_NETWORK']

    @patch('app.backend.docker_scan.docker.from_env')
    def test_multiple_networks_ip_selection_fallback(self, mock_docker_from_env):
        # Ensure env var is not set (or set to something else)
        if 'DOCKER_NETWORK' in os.environ:
            del os.environ['DOCKER_NETWORK']

        # Mock the Docker client and container
        mock_client = MagicMock()
        mock_container = MagicMock()

        # Setup container attributes with multiple networks
        # Put network_b first
        mock_container.attrs = {
            'Name': '/test-container',
            'Config': {
                'Image': 'nginx:latest',
                'Labels': {}
            },
            'State': {'Status': 'running'},
            'Created': '2023-01-01T00:00:00Z',
            'NetworkSettings': {
                'Networks': {
                    'network_b': {'IPAddress': '192.168.1.1'},
                    'network_a': {'IPAddress': '10.0.0.1'}
                },
                'Ports': {}
            }
        }

        # Mock the list method to return our container
        mock_client.containers.list.return_value = [mock_container]
        mock_docker_from_env.return_value = mock_client

        # Run the scan
        containers = get_running_containers()

        # Check the result
        self.assertEqual(len(containers), 1)
        container = containers[0]

        print(f"Selected IP (fallback): {container['ip_address']}")
        # It should pick network_b's IP because it's first in the dict and no preference is set
        self.assertEqual(container['ip_address'], '192.168.1.1')

if __name__ == '__main__':
    unittest.main()
