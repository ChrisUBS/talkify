import pytest
import json
from unittest.mock import patch, MagicMock
from server import app

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_google_user_info():
    """Create sample Google user info for testing."""
    return {
        "sub": "google_user_id",
        "email": "user@example.com",
        "name": "Google User",
        "picture": "https://example.com/photo.jpg"
    }

# Test Google login - versión corregida
@patch('server.db')
@patch('google.oauth2.id_token.verify_oauth2_token')
def test_login(mock_verify_token, mock_db, client, sample_google_user_info):
    """Test login with Google authentication."""
    # Setup mocks
    mock_verify_token.return_value = sample_google_user_info
    mock_db.users.update_one.return_value = MagicMock()
    
    # Mockear la función create_access_token dentro del endpoint
    with patch('server.create_access_token') as mock_create_token:
        # Configurar para que devuelva un token específico
        mock_create_token.return_value = "test_jwt_token"
        
        # Prepare request data
        login_data = {
            "token": "google_id_token"
        }
        
        # Make request
        response = client.post(
            '/api/auth/login',
            json=login_data
        )
        
        # Debug info
        print(f"Login response: {response.data}")
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "accessToken" in data
        assert "user" in data
        assert data["user"]["userId"] == sample_google_user_info["sub"]
        assert data["user"]["email"] == sample_google_user_info["email"]
        
        # Verificar que create_access_token fue llamado con el id de usuario
        mock_create_token.assert_called_once_with(identity=sample_google_user_info["sub"])
        
        # Verify DB operations
        mock_db.users.update_one.assert_called_once()

# Test login without token
def test_login_without_token(client):
    """Test login without providing a token."""
    # Prepare request data (missing token)
    login_data = {}
    
    # Make request
    response = client.post(
        '/api/auth/login',
        json=login_data
    )
    
    # Assertions
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Token is required" in data["error"]

# Test login with invalid token
@patch('google.oauth2.id_token.verify_oauth2_token')
def test_login_with_invalid_token(mock_verify_token, client):
    """Test login with an invalid Google token."""
    # Setup mock to raise exception
    mock_verify_token.side_effect = ValueError("Invalid token")
    
    # Prepare request data
    login_data = {
        "token": "invalid_google_id_token"
    }
    
    # Make request
    response = client.post(
        '/api/auth/login',
        json=login_data
    )
    
    # Assertions
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "error" in data
    assert "Invalid token" in data["error"]
