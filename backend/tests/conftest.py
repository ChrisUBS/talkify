import pytest
import os
import sys
import datetime
from unittest.mock import patch, MagicMock
from bson.objectid import ObjectId

# Asegurarse de que el directorio raíz del proyecto está en sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Fixtures comunes para todas las pruebas
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment variables and configurations."""
    # Set environment variables for testing
    os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key"
    os.environ["GOOGLE_CLIENT_ID"] = "test_google_client_id"
    
    # Mock MongoDB connection
    with patch('server.db') as mock_db:
        yield mock_db

@pytest.fixture
def mock_object_id():
    """Create a mock ObjectId for testing."""
    return str(ObjectId())

@pytest.fixture
def common_user():
    """Create a common user fixture for testing."""
    return {
        "userId": "test_user_id",
        "name": "Test User",
        "email": "test@example.com",
        "profilePicture": "https://example.com/pic.jpg",
        "lastLogin": datetime.datetime.utcnow().isoformat()
    }

@pytest.fixture
def common_post(common_user):
    """Create a common post fixture for testing."""
    return {
        "_id": ObjectId(),
        "title": "Test Post",
        "content": "This is a test post content",
        "author": {
            "userId": common_user["userId"],
            "name": common_user["name"],
            "profilePicture": common_user["profilePicture"]
        },
        "slug": "test-post",
        "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
        "updatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
        "status": "published",
        "readTime": 1,
        "views": 0,
        "likes": 0,
        "comments": []
    }

@pytest.fixture
def jwt_mock():
    """Mock de JWT para bypass de autenticación."""
    with patch('flask_jwt_extended.verify_jwt_in_request') as mock_verify_jwt:
        mock_verify_jwt.return_value = None
        with patch('flask_jwt_extended.get_jwt_identity') as mock_identity:
            mock_identity.return_value = "test_user_id"
            yield mock_identity

@pytest.fixture
def auth_headers():
    """Create authentication headers for testing."""
    return {"Authorization": "Bearer test_token"}