'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { postService } from '@/services/api'
import { Post } from '@/types'
import { Search, MessageCircle, ThumbsUp, Calendar, User, Clock } from 'lucide-react'
import Image from 'next/image'

export default function SearchPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return
      
      try {
        setLoading(true)
        const results = await postService.searchPosts(query)
        setPosts(results)
        setError(null)
      } catch (err) {
        console.error('Error searching posts:', err)
        setError('Error al buscar. Inténtalo nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  const handlePostClick = (slug: string) => {
    router.push(`/posts/${slug}`)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
          <Search className="w-8 h-8 mr-2 text-blue-600" />
          Resultados de búsqueda: "{query}"
        </h1>
        {posts.length > 0 && (
          <p className="text-gray-600">Se encontraron {posts.length} resultados</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-2xl text-gray-500 mb-2">No se encontraron resultados</p>
          <p className="text-gray-500 mb-6">Intenta con términos de búsqueda diferentes</p>
          <button 
            onClick={() => router.push('/posts')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Ver todas las publicaciones
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post) => (
            <div 
              key={post._id}
              onClick={() => handlePostClick(post.slug)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col md:flex-row"
            >
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                
                <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {post.readTime} min
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {post.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center">
                  {post.author.profilePicture ? (
                    <Image 
                      src={post.author.profilePicture} 
                      alt={post.author.name}
                      width={24}
                      height={24}
                      className="rounded-full mr-2"
                    />
                  ) : (
                    <User className="w-5 h-5 mr-2 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-700">{post.author.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}