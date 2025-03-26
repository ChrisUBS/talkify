'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
    Home,
    PenTool,
    MessageCircle,
    User
} from 'lucide-react'

export default function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <MessageCircle className="text-blue-600" size={30} />
                    <span className="text-2xl font-bold text-gray-800">Talkify</span>
                </Link>

                {/* Menú de Navegación */}
                <div className="flex items-center space-x-6">
                    <Link
                        href="/"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                    >
                        <Home size={20} />
                        <span className="hidden md:inline">Inicio</span>
                    </Link>

                    {session && (
                        <Link
                            href="/posts/new"
                            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                        >
                            <PenTool size={20} />
                            <span className="hidden md:inline">Crear Post</span>
                        </Link>
                    )}

                    {/* Perfil o Inicio de Sesión */}
                    {session ? (
                        <div className="flex items-center space-x-3">
                            <Link href="/profile" className="flex items-center space-x-2">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="Perfil"
                                        width={36}
                                        height={36}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <User size={24} className="text-gray-600" />
                                )}
                                <span className="hidden md:inline text-gray-700">
                                    {session.user?.name?.split(' ')[0]}
                                </span>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
                            >
                                Salir
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center space-x-2"
                        >
                            <span>Iniciar Sesión</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}