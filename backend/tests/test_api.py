import pytest
import json
import datetime
from bson.objectid import ObjectId
from unittest.mock import patch, MagicMock
from server import app

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_db():
    """Mock the database for testing."""
    with patch('server.db') as mock_db:
        yield mock_db

@pytest.fixture
def sample_post():
    """Create a sample post for testing."""
    return {
        "_id": ObjectId(),
        "title": "Test Post",
        "content": "This is a test post content",
        "author": {
            "userId": "test_user_id",
            "name": "Test User",
            "profilePicture": "https://example.com/pic.jpg"
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

# Test home endpoint
def test_home(client):
    """Test the home endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Talkify API" in response.data

# Test get posts
def test_get_posts(client, mock_db, sample_post):
    """Test getting all posts."""
    # Setup mock
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value.skip.return_value.limit.return_value = [sample_post]
    mock_db.posts.find.return_value = mock_cursor
    mock_db.posts.count_documents.return_value = 1
    
    # Make request
    response = client.get('/api/posts')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "posts" in data
    assert len(data["posts"]) == 1
    assert "pagination" in data
    assert data["pagination"]["total"] == 1

# Test get post by ID
def test_get_post_by_id(client, mock_db, sample_post):
    """Test getting a post by ID."""
    post_id = str(sample_post["_id"])
    
    # Setup mock
    mock_db.posts.find_one.return_value = sample_post
    
    # Make request
    response = client.get(f'/api/posts/{post_id}')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["title"] == sample_post["title"]
    assert data["content"] == sample_post["content"]
    
    # Verify view count was incremented
    mock_db.posts.update_one.assert_called_once()

# Test get post by slug
def test_get_post_by_slug(client, mock_db, sample_post):
    """Test getting a post by slug."""
    # Setup mock
    mock_db.posts.find_one.return_value = sample_post
    
    # Make request
    response = client.get('/api/posts/slug/test-post')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["title"] == sample_post["title"]
    assert data["slug"] == "test-post"
    
    # Verify view count was incremented
    mock_db.posts.update_one.assert_called_once()

# Test post not found
def test_post_not_found(client, mock_db):
    """Test getting a non-existent post."""
    # Usar un ObjectId válido pero que no existe
    valid_id = str(ObjectId())
    
    # Setup mock
    mock_db.posts.find_one.return_value = None
    
    # Make request
    response = client.get(f'/api/posts/{valid_id}')
    
    # Assertions
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data
    assert "Post not found" in data["error"]
