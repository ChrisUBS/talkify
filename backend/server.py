# Libraries
from flask import Flask, request, jsonify
from http import HTTPStatus
import json
from config import db
from flask_cors import CORS
import os
import datetime
from bson.objectid import ObjectId
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
import re
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app)  # Warning: this enables CORS for all origins

# Configuración de JWT
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "your-secret-key")  # Cambiar en producción
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)  # Los tokens expiran en 7 días
jwt = JWTManager(app)

# Configuración de Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

##############################################
################## Utils #####################
##############################################

# Fix the id from MongoDB
def fix_id(obj):
    if obj and "_id" in obj:
        obj["_id"] = str(obj["_id"])
    return obj

# Fix all IDs in an array of objects
def fix_ids(objects):
    return [fix_id(obj) for obj in objects]

# Get user data from database
def get_user_data(user_id):
    user = db.users.find_one({"userId": user_id})
    if user:
        return {
            "userId": user["userId"],
            "name": user["name"],
            "email": user.get("email"),
            "profilePicture": user.get("profilePicture")
        }
    return None

# Create slug from title
def create_slug(title):
    # Convertir a minúsculas y reemplazar espacios por guiones
    slug = title.lower().replace(" ", "-")
    # Eliminar caracteres especiales
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    return slug

# Calculate read time
def calculate_read_time(content):
    words = len(content.split())
    return max(1, round(words / 200))  # Asumiendo 200 palabras por minuto

##############################################
################ ENDPOINTS ###################
##############################################

# Home page
@app.get("/")
def home():
    return "<h1>Talkify API - Backend en Flask para la plataforma de blogs</h1>", HTTPStatus.OK

# Autenticación con Google
@app.post("/api/auth/login")
def login():
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return {"error": "Token is required"}, HTTPStatus.BAD_REQUEST
        
        # Verificar el token de Google
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        # Extraer información del usuario
        user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Crear o actualizar usuario en la base de datos
        user = {
            "userId": user_id,
            "name": name,
            "email": email,
            "profilePicture": picture,
            "lastLogin": datetime.datetime.utcnow().isoformat()
        }
        
        db.users.update_one(
            {"userId": user_id},
            {"$set": user},
            upsert=True
        )
        
        # Generar token JWT
        access_token = create_access_token(identity=user_id)
        
        return {"accessToken": access_token, "user": user}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.UNAUTHORIZED

# GET (get all posts)
@app.get("/api/posts")
def get_posts():
    try:
        # Opciones de filtrado y paginación
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", "published")
        
        # Calcular skip para paginación
        skip = (page - 1) * limit
        
        # Crear filtro
        filter_query = {"status": status}
        
        # Obtener total de posts para paginación
        total_posts = db.posts.count_documents(filter_query)
        
        # Obtener posts paginados
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get post by id)
@app.get("/api/posts/<id>")
def get_post_by_id(id):
    try:
        post = db.posts.find_one({"_id": ObjectId(id)})
        if post:
            # Incrementar contador de vistas
            db.posts.update_one({"_id": ObjectId(id)}, {"$inc": {"views": 1}})
            post["views"] += 1  # Actualizar el objeto antes de devolverlo
            return jsonify(fix_id(post)), HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get post by slug)
@app.get("/api/posts/slug/<slug>")
def get_post_by_slug(slug):
    try:
        post = db.posts.find_one({"slug": slug})
        if post:
            # Incrementar contador de vistas
            db.posts.update_one({"_id": post["_id"]}, {"$inc": {"views": 1}})
            post["views"] += 1  # Actualizar el objeto antes de devolverlo
            return jsonify(fix_id(post)), HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# POST (create a new post)
@app.post("/api/posts")
@jwt_required()
def save_post():
    try:
        post_data = request.get_json()
        
        # Validación básica
        if not post_data.get("title") or not post_data.get("content"):
            return {"error": "Title and content are required"}, HTTPStatus.BAD_REQUEST
        
        # Obtener información del usuario autenticado
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if not user_data:
            return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
        
        # Crear el slug a partir del título
        slug = create_slug(post_data["title"])
        
        # Verificar si el slug ya existe
        existing_post = db.posts.find_one({"slug": slug})
        if existing_post:
            # Añadir un sufijo único si el slug ya existe
            slug = f"{slug}-{str(ObjectId())[-6:]}"
        
        # Calcular tiempo de lectura
        read_time = calculate_read_time(post_data["content"])
        
        # Crear el post
        now = datetime.datetime.utcnow().isoformat()
        new_post = {
            "title": post_data["title"],
            "content": post_data["content"],
            "author": user_data,
            "slug": slug,
            "createdAt": now,
            "updatedAt": now,
            "status": post_data.get("status", "published"),
            "readTime": read_time,
            "views": 0,
            "likes": 0,
            "comments": [],
            # Añadir imagen de portada solo si está presente
            "coverImage": post_data.get("coverImage") 
        }
        
        result = db.posts.insert_one(new_post)
        new_post["_id"] = str(result.inserted_id)
        
        return jsonify(new_post), HTTPStatus.CREATED
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# PUT (update a post)
@app.put("/api/posts/<id>")
@jwt_required()
def update_post(id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Verificar si el post existe y pertenece al usuario
        post = db.posts.find_one({"_id": ObjectId(id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
            
        if post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only edit your own posts"}, HTTPStatus.UNAUTHORIZED
        
        # Preparar datos a actualizar
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
            # Actualizar el slug si cambia el título
            new_slug = create_slug(data["title"])
            
            # Verificar si el nuevo slug ya existe y es diferente al actual
            if new_slug != post.get("slug"):
                existing_post = db.posts.find_one({"slug": new_slug, "_id": {"$ne": ObjectId(id)}})
                if existing_post:
                    # Añadir un sufijo único si el slug ya existe
                    new_slug = f"{new_slug}-{str(ObjectId())[-6:]}"
            
            update_data["slug"] = new_slug
            
        if "content" in data:
            update_data["content"] = data["content"]
            # Recalcular tiempo de lectura si cambia el contenido
            update_data["readTime"] = calculate_read_time(data["content"])
            
        if "status" in data:
            update_data["status"] = data["status"]
            
        # Manejar la imagen de portada
        if "coverImage" in data:
            update_data["coverImage"] = data["coverImage"]  # Puede ser una URL o null
            
        # Actualizar fecha de modificación
        update_data["updatedAt"] = datetime.datetime.utcnow().isoformat()
        
        result = db.posts.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        
        if result.matched_count:
            # Obtener el post actualizado para devolverlo
            updated_post = db.posts.find_one({"_id": ObjectId(id)})
            return jsonify(fix_id(updated_post)), HTTPStatus.OK
            
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# DELETE (delete a post)
@app.delete("/api/posts/<id>")
@jwt_required()
def delete_post(id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar si el post existe y pertenece al usuario
        post = db.posts.find_one({"_id": ObjectId(id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
            
        if post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only delete your own posts"}, HTTPStatus.UNAUTHORIZED
        
        result = db.posts.delete_one({"_id": ObjectId(id)})
        if result.deleted_count:
            # También eliminar los likes asociados
            db.post_likes.delete_many({"postId": id})
            return {"message": "Post deleted successfully"}, HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get comments for a post)
@app.get("/api/posts/<post_id>/comments")
def get_comments(post_id):
    try:
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        comments = post.get("comments", [])
        return jsonify(comments), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# POST (create a comment for a post)
@app.post("/api/posts/<post_id>/comments")
@jwt_required()
def create_comment(post_id):
    try:
        comment_data = request.get_json()
        
        # Validación básica
        if not comment_data.get("content"):
            return {"error": "Comment content is required"}, HTTPStatus.BAD_REQUEST
        
        # Obtener información del usuario autenticado
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if not user_data:
            return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
        
        # Crear el comentario
        comment = {
            "_id": str(ObjectId()),  # Generar ID único para el comentario
            "content": comment_data["content"],
            "author": {
                "userId": user_data["userId"],
                "name": user_data["name"],
                "profilePicture": user_data.get("profilePicture")
            },
            "createdAt": datetime.datetime.utcnow().isoformat(),
            "likes": 0
        }
        
        # Añadir el comentario al post
        result = db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
        
        if result.matched_count:
            return jsonify(comment), HTTPStatus.CREATED
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# DELETE (delete a comment from a post)
@app.delete("/api/posts/<post_id>/comments/<comment_id>")
@jwt_required()
def delete_comment(post_id, comment_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar si el post existe
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        # Encontrar el comentario
        comment = next((c for c in post.get("comments", []) if c["_id"] == comment_id), None)
        if not comment:
            return {"error": "Comment not found"}, HTTPStatus.NOT_FOUND
        
        # Verificar permisos: solo el autor del comentario o el autor del post puede eliminarlo
        if comment["author"]["userId"] != user_id and post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only delete your own comments"}, HTTPStatus.UNAUTHORIZED
        
        # Eliminar el comentario
        result = db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"comments": {"_id": comment_id}}}
        )
        
        if result.modified_count:
            return {"message": "Comment deleted successfully"}, HTTPStatus.OK
        return {"error": "Comment not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para dar like a un post
@app.post("/api/posts/<post_id>/like")
@jwt_required()
def like_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar si el post existe
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        # Añadir el like y el usuario a la lista de likes (si no existe ya)
        if not db.post_likes.find_one({"postId": post_id, "userId": user_id}):
            db.post_likes.insert_one({
                "postId": post_id,
                "userId": user_id,
                "createdAt": datetime.datetime.utcnow().isoformat()
            })
            
            # Incrementar contador de likes
            db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes": 1}}
            )
            
            return {"message": "Post liked successfully"}, HTTPStatus.OK
        else:
            return {"message": "Post already liked"}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para quitar like de un post
@app.delete("/api/posts/<post_id>/like")
@jwt_required()
def unlike_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar si existe el like
        if db.post_likes.find_one({"postId": post_id, "userId": user_id}):
            # Eliminar el like
            db.post_likes.delete_one({"postId": post_id, "userId": user_id})
            
            # Decrementar contador de likes
            db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes": -1}}
            )
            
            return {"message": "Post unliked successfully"}, HTTPStatus.OK
        else:
            return {"message": "Post was not liked"}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para verificar si un usuario dio like a un post
@app.get("/api/posts/<post_id>/like")
@jwt_required()
def check_like(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar si existe el like
        like = db.post_likes.find_one({"postId": post_id, "userId": user_id})
        
        return {"liked": like is not None}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para buscar posts
@app.get("/api/posts/search")
def search_posts():
    try:
        query = request.args.get("q", "")
        if not query:
            return {"error": "Search query is required"}, HTTPStatus.BAD_REQUEST
        
        # Buscar en título y contenido
        cursor = db.posts.find({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"content": {"$regex": query, "$options": "i"}}
            ],
            "status": "published"  # Solo buscar posts publicados
        }).sort("createdAt", -1)
        
        results = fix_ids(list(cursor))
        return jsonify(results), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para obtener posts de un usuario específico
@app.get("/api/users/<user_id>/posts")
def get_user_posts(user_id):
    try:
        # Opciones de filtrado y paginación
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", "published")
        
        # Calcular skip para paginación
        skip = (page - 1) * limit
        
        # Crear filtro
        filter_query = {"author.userId": user_id, "status": status}
        
        # Obtener total de posts para paginación
        total_posts = db.posts.count_documents(filter_query)
        
        # Obtener posts paginados
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para obtener posts del usuario autenticado (incluyendo borradores)
@app.get("/api/users/me/posts")
@jwt_required()
def get_my_posts():
    try:
        user_id = get_jwt_identity()
        
        # Opciones de filtrado y paginación
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", None)  # Opcional: filtrar por estado
        
        # Calcular skip para paginación
        skip = (page - 1) * limit
        
        # Crear filtro
        filter_query = {"author.userId": user_id}
        if status:
            filter_query["status"] = status
        
        # Obtener total de posts para paginación
        total_posts = db.posts.count_documents(filter_query)
        
        # Obtener posts paginados
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint para verificar el estado de autenticación
@app.get("/api/auth/check")
@jwt_required()
def check_auth():
    try:
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if user_data:
            return jsonify(user_data), HTTPStatus.OK
        return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.UNAUTHORIZED

##############################################
################# RUN SERVER #################
##############################################

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)