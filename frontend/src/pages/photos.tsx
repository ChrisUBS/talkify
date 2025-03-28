import { useState } from 'react';
import Head from 'next/head';
import ImageGallery from '../components/ImageGallery';

export default function PhotosPage() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeQuery, setActiveQuery] = useState<string>('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveQuery(searchQuery);
    };

    return (
        <div>
            <Head>
                <title>Buscador de Imágenes Pexels</title>
                <meta name="description" content="Busca imágenes gratuitas en Pexels" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold text-center my-6">Buscador de Imágenes Pexels</h1>

                <form onSubmit={handleSearch} className="flex justify-center mb-8">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar imágenes..."
                        className="px-4 py-2 border border-gray-300 rounded-l w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition"
                    >
                        Buscar
                    </button>
                </form>

                {activeQuery && <ImageGallery query={activeQuery} />}

                {!activeQuery && (
                    <div className="text-center my-12">
                        <p className="text-gray-600">
                            Ingresa un término de búsqueda para encontrar imágenes
                        </p>
                    </div>
                )}
            </main>

            <footer className="bg-gray-100 mt-12 py-6">
                <div className="container mx-auto text-center">
                    <p className="text-gray-600">
                        Imágenes proporcionadas por{' '}
                        <a
                            href="https://www.pexels.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            Pexels
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}