'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { postService } from '@/services/api'
import { Post } from '@/types'
import { Edit, Save, AlignLeft, Clock, AlertCircle, ImageIcon, X } from 'lucide-react'
import Image from 'next/image'

// Configuración de Pexels
const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY
const PEXELS_API_URL = 'https://api.pexels.com/v1/search'

interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    liked: boolean;
    alt: string;
}

export default function EditPostPage() {
    const [post, setPost] = useState<Post | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [status, setStatus] = useState('published')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estados para imágenes de Pexels
    const [recommendedImages, setRecommendedImages] = useState<PexelsPhoto[]>([])
    const [selectedImage, setSelectedImage] = useState<PexelsPhoto | null>(null)
    const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(null)
    const [imageLoading, setImageLoading] = useState(false)

    const router = useRouter()
    const params = useParams<{ id: string }>()
    const postId = params?.id ?? '';

    const { data: session, status: sessionStatus } = useSession()

    // Verificar que el usuario esté autenticado
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push('/');
        }
    }, [sessionStatus, router]);

    // Cargar datos del post
    useEffect(() => {
        const fetchPost = async () => {
            if (!postId || sessionStatus !== 'authenticated') return;

            try {
                setLoading(true);
                const fetchedPost = await postService.getPostById(postId);

                // Verificar que el post pertenezca al usuario
                if (fetchedPost.author.userId !== session?.user.userId) {
                    setError('No tienes permiso para editar este post');
                    return;
                }

                setPost(fetchedPost);
                setTitle(fetchedPost.title);
                setContent(fetchedPost.content);
                setStatus(fetchedPost.status);
                setCurrentCoverImage(fetchedPost.coverImage || null);
                setError(null);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Error al cargar el post. Verifica que exista y que tengas permisos para editarlo.');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId, session, sessionStatus]);

    // Función para buscar imágenes en Pexels
    const fetchPexelsImages = async (query: string) => {
        if (!query.trim() || !PEXELS_API_KEY) return;

        setImageLoading(true)
        try {
            const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=6`, {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`Error en la respuesta de Pexels: ${response.status}`);
            }

            const data = await response.json()
            setRecommendedImages(data.photos || [])
        } catch (err) {
            console.error('Error fetching Pexels images:', err)
        } finally {
            setImageLoading(false)
        }
    }

    // Efecto para buscar imágenes cuando cambia el título
    useEffect(() => {
        if (title.trim()) {
            // Implementamos un debounce para no hacer muchas solicitudes
            const debounceTimer = setTimeout(() => {
                fetchPexelsImages(title);
            }, 500);

            return () => clearTimeout(debounceTimer);
        }
    }, [title]);

    // Función para eliminar la imagen
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setCurrentCoverImage(null);
    };

    // Calcular tiempo de lectura aproximado
    const calculateReadTime = (text: string) => {
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 200)); // 200 palabras por minuto
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setError('Título y contenido son requeridos');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const updatedPost = await postService.updatePost(postId, {
                title: title.trim(),
                content: content.trim(),
                status,
                coverImage: selectedImage?.src.large || currentCoverImage
            });

            // Redirigir a la página del post
            router.push(`/posts/${updatedPost.slug}`);
        } catch (err) {
            console.error('Error updating post:', err);
            setError('Error al actualizar el post. Inténtalo nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-3xl">
                <div className="bg-red-100 border border-red-400 text-red-700 p-6 rounded-lg flex items-start">
                    <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Error</h3>
                        <p>{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                        <Edit className="w-8 h-8 mr-2 text-blue-600" />
                        Editar Publicación
                    </h1>
                    <p className="text-gray-600">Actualiza tu publicación en Talkify</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                            Título
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Escribe un título atractivo..."
                            required
                        />
                    </div>

                    {/* Sección de imágenes recomendadas */}
                    <div className="mb-6">
                        <div className="flex items-center mb-2 justify-between">
                            <div className="flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                                <h3 className="text-gray-700 font-medium">Imagen de portada (opcional)</h3>
                            </div>
                        </div>

                        {/* Imagen actual o seleccionada */}
                        {(currentCoverImage || selectedImage) && (
                            <div className="mb-4 relative">
                                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                    <Image
                                        src={selectedImage?.src.large || currentCoverImage!}
                                        alt="Imagen de portada"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 768px"
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        aria-label="Eliminar imagen"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {selectedImage && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        Foto por <a
                                            href={selectedImage.photographer_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            {selectedImage.photographer}
                                        </a> en Pexels
                                    </div>
                                )}
                            </div>
                        )}

                        {title.trim() && (
                            <>
                                <div className="mt-4 mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Imágenes sugeridas (Pexels)</h4>
                                </div>

                                {imageLoading ? (
                                    <div className="flex justify-center items-center p-4">
                                        <span>Cargando imágenes...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            {recommendedImages.map((image) => (
                                                <div
                                                    key={image.id}
                                                    onClick={() => {
                                                        setSelectedImage(image);
                                                        setCurrentCoverImage(null);
                                                    }}
                                                    className={`cursor-pointer rounded-lg overflow-hidden border-2 hover:border-blue-500 transition ${selectedImage?.id === image.id
                                                        ? 'border-blue-600'
                                                        : 'border-transparent'
                                                        }`}
                                                >
                                                    <div className="relative h-36 w-full">
                                                        <Image
                                                            src={image.src.medium}
                                                            alt={image.alt || `Foto por ${image.photographer}`}
                                                            fill
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-2 text-xs text-center truncate">
                                                        Por: {image.photographer}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {recommendedImages.length === 0 && !imageLoading && (
                                            <div className="text-center p-4 bg-gray-50 rounded my-2">
                                                No se encontraron imágenes para "{title}". Intenta con otras palabras clave.
                                            </div>
                                        )}

                                        <div className="text-xs text-right mt-2 text-gray-500">
                                            Imágenes proporcionadas por <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Pexels</a>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                            Contenido
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Escribe el contenido de tu publicación..."
                            rows={12}
                            required
                        />
                    </div>

                    {/* Información adicional */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-gray-700">
                                <AlignLeft className="w-5 h-5" />
                                <span>Palabras: {content.trim().split(/\s+/).length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-700">
                                <Clock className="w-5 h-5" />
                                <span>Tiempo de lectura: ~{calculateReadTime(content)} min</span>
                            </div>
                        </div>
                    </div>

                    {/* Estado del post */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Estado
                        </label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="status"
                                    value="published"
                                    checked={status === 'published'}
                                    onChange={() => setStatus('published')}
                                />
                                <span className="ml-2">Publicado</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="status"
                                    value="draft"
                                    checked={status === 'draft'}
                                    onChange={() => setStatus('draft')}
                                />
                                <span className="ml-2">Borrador</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="mr-4 bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition flex items-center disabled:opacity-70"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}