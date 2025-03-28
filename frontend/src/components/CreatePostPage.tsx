'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { postService } from '@/services/api'
import { PenTool, Save, AlignLeft, Clock, ImageIcon } from 'lucide-react'
import Image from 'next/image'

// Configuración de Unsplash
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos'

interface UnsplashImage {
  id: string
  urls: {
    small: string
    regular: string
  }
  alt_description: string
}

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('published')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para imágenes de Unsplash
  const [recommendedImages, setRecommendedImages] = useState<UnsplashImage[]>([])
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  const router = useRouter()
  const { data: _session, status: sessionStatus } = useSession()
  
  // Redirigir si no está autenticado
  if (sessionStatus === 'unauthenticated') {
    router.push('/')
    return null
  }

  // Calcular tiempo de lectura aproximado
  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)); // 200 palabras por minuto
  };

  // Función para buscar imágenes en Unsplash
  const fetchUnsplashImages = async (query: string) => {
    if (!query.trim() || !UNSPLASH_ACCESS_KEY) return;

    setImageLoading(true)
    try {
      const response = await fetch(`${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=6`, {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      });
      
      const data = await response.json()
      setRecommendedImages(data.results)
    } catch (err) {
      console.error('Error fetching Unsplash images:', err)
    } finally {
      setImageLoading(false)
    }
  }

  // Efecto para buscar imágenes cuando cambia el título
  useEffect(() => {
    if (title.trim()) {
      fetchUnsplashImages(title)
    }
  }, [title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Título y contenido son requeridos')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const newPost = await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        status,
        coverImage: selectedImage?.urls.regular
      })
      
      // Redirigir a la página del nuevo post
      router.push(`/posts/${newPost.slug}`)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Error al crear el post. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <PenTool className="w-8 h-8 mr-2 text-blue-600" />
            Crear Nueva Publicación
          </h1>
          <p className="text-gray-600">Comparte tus ideas con la comunidad de Talkify</p>
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
          {title.trim() && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="text-gray-700 font-medium">Imágenes sugeridas</h3>
              </div>
              
              {imageLoading ? (
                <div className="flex justify-center items-center">
                  <span>Cargando imágenes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {recommendedImages.map((image) => (
                    <div 
                      key={image.id} 
                      onClick={() => setSelectedImage(image)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 hover:border-blue-500 transition ${
                        selectedImage?.id === image.id 
                          ? 'border-blue-600' 
                          : 'border-transparent'
                      }`}
                    >
                      <Image 
                        src={image.urls.small} 
                        alt={image.alt_description || 'Imagen de Unsplash'} 
                        width={200} 
                        height={150} 
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
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
                <span className="ml-2">Publicar</span>
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
                <span className="ml-2">Guardar como borrador</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="mr-4 bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition flex items-center disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {status === 'published' ? 'Publicar' : 'Guardar borrador'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}