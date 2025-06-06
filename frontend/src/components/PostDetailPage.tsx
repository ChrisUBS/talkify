'use client'

import "./postDetailPage.css";
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { postService, commentService } from '@/services/api'
import { Post, Comment } from '@/types'
import { User, Calendar, MessageCircle, Send, ThumbsUp, Clock, Eye, ImageIcon, Camera, Trash2 } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function PostDetailPage() {
    const [post, setPost] = useState<Post | null>(null)
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [commentLoading, setCommentLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
    const [liked, setLiked] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { data: session } = useSession()
    const params = useParams<{ slug: string }>()
    const router = useRouter()
    const slug = params?.slug ?? '';

    // Verificar si la URL de la imagen es de Pexels
    const isFromPexels = (url: string) => {
        return url && url.includes('images.pexels.com');
    };

    useEffect(() => {
        const fetchPostData = async () => {
            if (!slug) return;

            try {
                setLoading(true)
                const postData = await postService.getPostBySlug(slug)
                setPost(postData)

                // Si el usuario está autenticado, verificar si le dio like al post
                if (session?.accessToken) {
                    const hasLiked = await postService.checkLike(postData._id)
                    setLiked(hasLiked)
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching post:', err)
                setError('Error al cargar el post. Inténtalo nuevamente.')
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchPostData()
        }
    }, [slug, session])

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim() || !session || !post) {
            return
        }

        try {
            setCommentLoading(true)
            const comment = await commentService.createComment(post._id, newComment)

            // Actualizar el post con el nuevo comentario
            setPost(prevPost => {
                if (!prevPost) return null;
                return {
                    ...prevPost,
                    comments: [...prevPost.comments, comment]
                }
            })

            setNewComment('')
        } catch (err) {
            console.error('Error creating comment:', err)
            alert('Error al crear el comentario')
        } finally {
            setCommentLoading(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!session || !post) return;

        if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            return;
        }

        try {
            setDeleteLoading(commentId)
            await commentService.deleteComment(post._id, commentId)

            // Actualizar el post eliminando el comentario
            setPost(prevPost => {
                if (!prevPost) return null;
                return {
                    ...prevPost,
                    comments: prevPost.comments.filter(comment => comment._id !== commentId)
                }
            })
        } catch (err) {
            console.error('Error deleting comment:', err)
            alert('Error al eliminar el comentario')
        } finally {
            setDeleteLoading(null)
        }
    }

    const handleLikeToggle = async () => {
        if (!session || !post) return;

        try {
            setLikeLoading(true)

            if (liked) {
                await postService.unlikePost(post._id)
                setPost(prev => {
                    if (!prev) return null;
                    return { ...prev, likes: prev.likes - 1 }
                })
            } else {
                await postService.likePost(post._id)
                setPost(prev => {
                    if (!prev) return null;
                    return { ...prev, likes: prev.likes + 1 }
                })
            }

            setLiked(!liked)
        } catch (err) {
            console.error('Error al gestionar like:', err)
        } finally {
            setLikeLoading(false)
        }
    }

    // Verificar si el usuario puede eliminar un comentario (es autor del comentario o del post)
    const canDeleteComment = (comment: Comment) => {
        if (!session || !post) return false;

        // Obtener el ID del usuario actual
        const userId = session.user?.userId;

        // Comparamos los IDs y devolvemos true si coincide alguno
        return userId === comment.author.userId || userId === post.author.userId;
    }

    // Formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error || 'No se pudo encontrar este post'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <article className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                {/* Cover Image */}
                {post.coverImage ? (
                    <div className="relative w-full h-96 overflow-hidden">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 1536px) 100vw, 1536px"
                        />
                        {/* Atribución a Pexels si la imagen proviene de allí */}
                        {isFromPexels(post.coverImage) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs">
                                <div className="flex items-center">
                                    <Camera className="w-4 h-4 mr-1" />
                                    <span>Foto proporcionada por <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a></span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

                    <div className="flex items-center mb-6">
                        <div className="flex items-center mr-6">
                            {post.author.profilePicture ? (
                                <Image
                                    src={post.author.profilePicture}
                                    alt={post.author.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full mr-2"
                                />
                            ) : (
                                <User className="w-10 h-10 p-2 bg-gray-200 rounded-full mr-2 text-gray-600" />
                            )}
                            <div>
                                <p className="font-medium text-gray-800">{post.author.name}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap text-sm text-gray-600 gap-x-4 gap-y-2">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(post.createdAt)}
                            </span>
                            <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {post.readTime} min de lectura
                            </span>
                            <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {post.views} vistas
                            </span>
                        </div>
                    </div>

                    {/* Contenido del post con soporte para markdown */}
                    <div className="prose prose-lg max-w-none mb-6 markdown-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                        <div className="flex items-center">
                            {session ? (
                                <button
                                    onClick={handleLikeToggle}
                                    disabled={likeLoading}
                                    className={`flex items-center space-x-2 ${liked ? 'text-blue-600' : 'text-gray-500'
                                        } hover:text-blue-600 transition disabled:opacity-50`}
                                >
                                    {liked ? <ThumbsUp className="w-5 h-5" /> : <ThumbsUp className="w-5 h-5" />}
                                    <span>{post.likes} Me gusta</span>
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <ThumbsUp className="w-5 h-5" />
                                    <span>{post.likes} Me gusta</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>

            {/* Sección de comentarios */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Comentarios ({post.comments.length})
                </h2>

                {/* Formulario de comentario */}
                {session ? (
                    <form onSubmit={handleSubmitComment} className="mb-8">
                        <div className="flex items-start space-x-4">
                            {session.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Tu foto"
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            ) : (
                                <User className="w-10 h-10 p-2 bg-gray-200 rounded-full text-gray-600" />
                            )}
                            <div className="flex-grow">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Escribe un comentario..."
                                    rows={3}
                                    required
                                ></textarea>
                                <button
                                    type="submit"
                                    disabled={commentLoading || !newComment.trim()}
                                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center disabled:opacity-50"
                                >
                                    {commentLoading ? 'Enviando...' : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Comentar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center mb-6">
                        <p>Inicia sesión para comentar</p>
                    </div>
                )}

                {/* Lista de comentarios */}
                <div className="space-y-6">
                    {post.comments.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">
                            No hay comentarios aún. ¡Sé el primero en comentar!
                        </p>
                    ) : (
                        post.comments.map((comment) => (
                            <div key={comment._id} className="border-b border-gray-100 pb-6">
                                <div className="flex items-start space-x-3">
                                    {comment.author.profilePicture ? (
                                        <Image
                                            src={comment.author.profilePicture}
                                            alt={comment.author.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 p-2 bg-gray-200 rounded-full text-gray-600" />
                                    )}
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center">
                                                <p className="font-medium text-gray-800 mr-2">{comment.author.name}</p>
                                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                            </div>

                                            {/* Botón de eliminar comentario - solo visible si el usuario puede eliminar */}
                                            {canDeleteComment(comment) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    disabled={deleteLoading === comment._id}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                    title="Eliminar comentario"
                                                >
                                                    {deleteLoading === comment._id ? (
                                                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}