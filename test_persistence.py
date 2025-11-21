
import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json
import asyncio

# Robustly add path for both sandbox and container environments
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'app'))

from backend.main import list_containers, update_domains, Request
import backend.config_manager as config_manager

# Mock Request object
class MockRequest:
    def __init__(self, data):
        self.data = data

    async def json(self):
        return self.data

class TestPersistenceFix(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.original_settings_file = config_manager.SETTINGS_FILE
        config_manager.SETTINGS_FILE = '/tmp/test_settings.json'

    def tearDown(self):
        config_manager.SETTINGS_FILE = self.original_settings_file
        if os.path.exists('/tmp/test_settings.json'):
            os.remove('/tmp/test_settings.json')

    @patch('backend.main.get_running_containers')
    @patch('backend.main.generate_config')
    @patch('backend.main.reload_zeronsd')
    async def test_persistence_workflow(self, mock_reload, mock_generate, mock_get_containers):
        # 1. Setup initial state
        container_data = {
            'id': 'container123',
            'name': 'test-container',
            'dns_enabled': True,
            'ip_address': '10.0.0.1'
        }
        # Use a deep copy or new dict to avoid reference issues
        mock_get_containers.return_value = [dict(container_data)]
        mock_generate.return_value = True
        mock_reload.return_value = True

        # Clean up
        if os.path.exists('/tmp/test_settings.json'):
            os.remove('/tmp/test_settings.json')

        # 2. Verify initial listing shows enabled
        containers = await list_containers()
        self.assertTrue(containers[0]['dns_enabled'])

        # 3. Simulate User Disabling it via update_domains
        updated_container = dict(container_data)
        updated_container['dns_enabled'] = False

        request = MockRequest({
            "containers": [updated_container],
            "remote_host": None
        })

        await update_domains(request)

        # 4. Verify settings file was written and contains container123
        with open('/tmp/test_settings.json', 'r') as f:
            data = json.load(f)
            self.assertIn('container123', data['disabled_containers'])

        # 5. Verify subsequent listing shows disabled
        mock_get_containers.return_value = [dict(container_data)]
        containers_after = await list_containers()
        self.assertFalse(containers_after[0]['dns_enabled'])

        # 6. Simulate a stopped container scenario
        # Assume we have another container 'container_stopped' that was disabled previously.
        # We manually add it to the settings file to simulate previous state.
        with open('/tmp/test_settings.json', 'w') as f:
            json.dump({"disabled_containers": ["container123", "container_stopped"]}, f)

        # Now user updates 'container123' back to enabled.
        # The payload will ONLY contain 'container123' because 'container_stopped' is not running.
        updated_container_2 = dict(container_data)
        updated_container_2['dns_enabled'] = True

        request_2 = MockRequest({
            "containers": [updated_container_2],
            "remote_host": None
        })

        await update_domains(request_2)

        # 7. Verify settings file:
        # - container123 should be removed (enabled)
        # - container_stopped should REMAIN (preserved)
        with open('/tmp/test_settings.json', 'r') as f:
            data = json.load(f)
            self.assertNotIn('container123', data['disabled_containers'])
            self.assertIn('container_stopped', data['disabled_containers'])

        print("Success: Stopped containers state preserved.")

if __name__ == '__main__':
    unittest.main()
