import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def mock_couchdb_params():
    """Mock CouchDB connection parameters"""
    return {
        "url": "http://localhost:9004",
        "username": "admin",
        "password": "password"
    }
