import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCouchDBAPI:
    """Backend API integration tests for CouchDB Client"""

    def test_api_root_returns_200(self):
        """Test that API root endpoint returns 200 with expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "CouchDB Client API"

    def test_api_root_response_structure(self):
        """Test that API root returns proper JSON structure"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.headers.get("Content-Type", "").startswith("application/json")
        data = response.json()
        assert isinstance(data, dict)

    def test_connection_endpoint_exists(self):
        """Test that connection endpoint exists and accepts POST"""
        data = {
            "url": "http://localhost:9004",
            "username": "admin",
            "password": "password"
        }
        response = requests.post(f"{BASE_URL}/api/couchdb/test-connection", json=data)
        # Should return 200 if CouchDB is available, or 500 if not
        # But endpoint should not return 404
        assert response.status_code != 404

    def test_databases_endpoint_exists(self):
        """Test that databases listing endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "username": "admin",
            "password": "password"
        }
        response = requests.get(f"{BASE_URL}/api/couchdb/databases", params=params)
        assert response.status_code != 404

    def test_documents_endpoint_exists(self):
        """Test that documents endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "database": "testdb",
            "username": "admin",
            "password": "password"
        }
        response = requests.get(f"{BASE_URL}/api/couchdb/documents", params=params)
        assert response.status_code != 404

    def test_document_get_endpoint_exists(self):
        """Test that single document GET endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "database": "testdb",
            "doc_id": "test_doc",
            "username": "admin",
            "password": "password"
        }
        response = requests.get(f"{BASE_URL}/api/couchdb/document", params=params)
        assert response.status_code != 404

    def test_document_put_endpoint_exists(self):
        """Test that single document PUT endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "database": "testdb",
            "doc_id": "test_doc",
            "username": "admin",
            "password": "password"
        }
        data = {"document": {"_id": "test_doc", "test": "data"}}
        response = requests.put(f"{BASE_URL}/api/couchdb/document", json=data, params=params)
        assert response.status_code != 404

    def test_document_post_endpoint_exists(self):
        """Test that document POST (create) endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "database": "testdb",
            "username": "admin",
            "password": "password"
        }
        data = {"document": {"test": "data"}}
        response = requests.post(f"{BASE_URL}/api/couchdb/document", json=data, params=params)
        assert response.status_code != 404

    def test_document_delete_endpoint_exists(self):
        """Test that document DELETE endpoint exists"""
        params = {
            "url": "http://localhost:9004",
            "database": "testdb",
            "doc_id": "test_doc",
            "rev": "1-test",
            "username": "admin",
            "password": "password"
        }
        response = requests.delete(f"{BASE_URL}/api/couchdb/document", params=params)
        assert response.status_code != 404

    def test_connection_error_returns_json_response(self):
        """Test that connection failures return proper JSON error responses"""
        data = {
            "url": "http://nonexistent-server:5984",
            "username": "admin",
            "password": "password"
        }
        response = requests.post(f"{BASE_URL}/api/couchdb/test-connection", json=data)
        # Should return 500 with JSON error
        assert response.status_code == 500
        error_data = response.json()
        assert "success" in error_data or "detail" in error_data
        if "success" in error_data:
            assert error_data["success"] == False

    def test_connection_requires_url_parameter(self):
        """Test that connection endpoint properly handles missing url"""
        data = {
            "username": "admin",
            "password": "password"
        }
        response = requests.post(f"{BASE_URL}/api/couchdb/test-connection", json=data)
        # Should fail in some way without url
        assert response.status_code in [400, 422, 500]
