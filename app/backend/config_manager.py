import json
import os
import logging
from typing import List, Dict, Any, Set

logger = logging.getLogger(__name__)

SETTINGS_FILE = "/data/settings.json"

def load_settings() -> Dict[str, Any]:
    """
    Load settings from the JSON file.

    Returns:
        Dict[str, Any]: The settings dictionary.
    """
    if not os.path.exists(SETTINGS_FILE):
        return {"disabled_containers": []}

    try:
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load settings: {e}")
        return {"disabled_containers": []}

def save_settings(settings: Dict[str, Any]) -> bool:
    """
    Save settings to the JSON file.

    Args:
        settings (Dict[str, Any]): The settings dictionary to save.

    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        return False

def get_disabled_containers() -> Set[str]:
    """
    Get the set of disabled container IDs.

    Returns:
        Set[str]: Set of disabled container IDs.
    """
    settings = load_settings()
    return set(settings.get("disabled_containers", []))

def set_disabled_containers(disabled_ids: List[str]) -> bool:
    """
    Set the list of disabled container IDs.

    Args:
        disabled_ids (List[str]): List of disabled container IDs.

    Returns:
        bool: True if successful.
    """
    settings = load_settings()
    settings["disabled_containers"] = disabled_ids
    return save_settings(settings)
