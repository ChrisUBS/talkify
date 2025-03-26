'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { MessageCircle, PenTool, Users } from 'lucide-react'

export default function WelcomePage() {
    const { data: session } = useSession()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pt-20">
            <div className="container mx-auto px-4 py-16">
                {/* Mensaje Principal */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
                        <MessageCircle size={50} className="text-blue-600" />
                        Bienvenido a Talkify
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Una plataforma para compartir ideas, conectar con personas y explorar
                        conversaciones fascinantes en un solo lugar.
                    </p>
                </div>

                {/* Sección de Características */}
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                    {/* Crear Posts */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <PenTool size={50} className="mx-auto text-blue-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Crear Posts</h3>
                        <p className="text-gray-600">
                            Comparte tus pensamientos, historias e ideas con nuestra comunidad.
                        </p>
                    </div>

                    {/* Explorar Contenido */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <MessageCircle size={50} className="mx-auto text-green-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Explorar Conversaciones</h3>
                        <p className="text-gray-600">
                            Descubre posts increíbles y participa en conversaciones relevantes.
                        </p>
                    </div>

                    {/* Comunidad */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <Users size={50} className="mx-auto text-purple-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Conecta</h3>
                        <p className="text-gray-600">
                            Conoce a personas con intereses similares y expande tu red.
                        </p>
                    </div>
                </div>

                {/* Llamado a la Acción */}
                <div className="text-center">
                    {session ? (
                        <Link
                            href="/posts"
                            className="bg-blue-600 text-white px-6 py-3 rounded-md text-xl hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            Explorar Posts <MessageCircle size={24} />
                        </Link>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md text-xl hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            Únete Ahora <PenTool size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}