import pytest
import json
from unittest.mock import patch, MagicMock
from bson.objectid import ObjectId
import datetime
from server import app

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_post_with_comments():
    """Create a sample post with comments for testing."""
    return {
        "_id": ObjectId(),
        "title": "Test Post with Comments",
        "content": "This is a test post content",
        "author": {
            "userId": "test_user_id",
            "name": "Test User",
            "profilePicture": "https://example.com/pic.jpg"
        },
        "slug": "test-post-with-comments",
        "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
        "updatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
        "status": "published",
        "readTime": 1,
        "views": 0,
        "likes": 0,
        "comments": [
            {
                "_id": "comment1",
                "content": "This is a test comment",
                "author": {
                    "userId": "test_user_id",
                    "name": "Test User",
                    "profilePicture": "https://example.com/pic.jpg"
                },
                "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
                "likes": 0
            }
        ]
    }

@pytest.fixture
def sample_posts():
    """Create sample posts for testing search functionality."""
    return [
        {
            "_id": ObjectId(),
            "title": "Python Programming Guide",
            "content": "This is a guide about Python programming language",
            "author": {
                "userId": "user123",
                "name": "John Doe",
                "profilePicture": "https://example.com/pic1.jpg"
            },
            "slug": "python-programming-guide",
            "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "updatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "status": "published",
            "readTime": 5,
            "views": 100,
            "likes": 25,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "JavaScript Basics",
            "content": "Learn the basics of JavaScript including python comparison",
            "author": {
                "userId": "user456",
                "name": "Jane Smith",
                "profilePicture": "https://example.com/pic2.jpg"
            },
            "slug": "javascript-basics",
            "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "updatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "status": "published",
            "readTime": 3,
            "views": 75,
            "likes": 15,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "Draft Article",
            "content": "This is a draft that should not appear in search results",
            "author": {
                "userId": "user789",
                "name": "Alex Brown",
                "profilePicture": "https://example.com/pic3.jpg"
            },
            "slug": "draft-article",
            "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "updatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "status": "draft",  # Este post es un borrador
            "readTime": 2,
            "views": 0,
            "likes": 0,
            "comments": []
        }
    ]

# Test get comments
@patch('server.db')
def test_get_comments(mock_db, client, sample_post_with_comments):
    """Test getting comments for a post."""
    post_id = str(sample_post_with_comments["_id"])
    
    # Setup mock
    mock_db.posts.find_one.return_value = sample_post_with_comments
    
    # Make request
    response = client.get(f'/api/posts/{post_id}/comments')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]["content"] == "This is a test comment"
    assert data[0]["_id"] == "comment1"

# Test search posts with query
@patch('server.db')
@patch('server.fix_ids')
def test_search_posts_with_query(mock_fix_ids, mock_db, client, sample_posts):
    """Test searching posts with a query term."""
    # Setup mocks
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = [sample_posts[0], sample_posts[1]]  # Ambos posts contienen 'python'
    mock_db.posts.find.return_value = mock_cursor
    
    # Mock de la función fix_ids para devolver la lista tal cual (con IDs convertidos)
    mock_fix_ids.side_effect = lambda x: [
        {**post, "_id": str(post["_id"])} for post in x
    ]
    
    # Make request
    response = client.get('/api/posts/search?q=python')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2
    assert "Python Programming Guide" in [post["title"] for post in data]
    assert "JavaScript Basics" in [post["title"] for post in data]
    
    # Verify correct query was used
    mock_db.posts.find.assert_called_once()
    call_args = mock_db.posts.find.call_args[0][0]
    assert "$or" in call_args
    assert "status" in call_args
    assert call_args["status"] == "published"

# Test search posts with empty query
@patch('server.db')
def test_search_posts_with_empty_query(mock_db, client):
    """Test searching posts with an empty query."""
    # Make request with empty query
    response = client.get('/api/posts/search?q=')
    
    # Assertions
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Search query is required" in data["error"]
    
    # Verify database was not queried
    mock_db.posts.find.assert_not_called()

# Test search posts without query parameter
@patch('server.db')
def test_search_posts_without_query_parameter(mock_db, client):
    """Test searching posts without providing a query parameter."""
    # Make request without query parameter
    response = client.get('/api/posts/search')
    
    # Assertions
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Search query is required" in data["error"]
    
    # Verify database was not queried
    mock_db.posts.find.assert_not_called()

# Test search posts with query matching no posts
@patch('server.db')
@patch('server.fix_ids')
def test_search_posts_with_no_results(mock_fix_ids, mock_db, client):
    """Test searching posts with a query that matches no posts."""
    # Setup mocks
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = []  # No posts match
    mock_db.posts.find.return_value = mock_cursor
    
    # Mock de la función fix_ids para devolver una lista vacía
    mock_fix_ids.return_value = []
    
    # Make request
    response = client.get('/api/posts/search?q=nonexistentterm')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 0
    assert isinstance(data, list)
    
    # Verify correct query was used
    mock_db.posts.find.assert_called_once()