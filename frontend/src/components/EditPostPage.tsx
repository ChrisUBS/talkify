'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { postService } from '@/services/api'
import { Post } from '@/types'
import { Edit, Save, AlignLeft, Clock, AlertCircle } from 'lucide-react'

export default function EditPostPage() {
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('published')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
        status
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
  )
}