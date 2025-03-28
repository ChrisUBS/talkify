import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PexelsPhoto } from '../types/pexels';

interface ImageGalleryProps {
    query: string;
}

export default function ImageGallery({ query }: ImageGalleryProps) {
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const fetchPhotos = async () => {
        if (!query) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/photos/search?query=${encodeURIComponent(query)}&page=${page}&perPage=15`);

            if (!response.ok) {
                throw new Error('Error al buscar imágenes');
            }

            const data = await response.json();

            setPhotos(prev => page === 1 ? data.photos : [...prev, ...data.photos]);
            setHasMore(data.photos.length > 0 && data.total_results > page * 15);
        } catch (err) {
            setError('Error al cargar imágenes de Pexels');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setPhotos([]);
        setHasMore(true);
    }, [query]);

    useEffect(() => {
        fetchPhotos();
    }, [query, page]);

    const loadMore = () => {
        setPage(prev => prev + 1);
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Resultados para: {query}</h2>

            {error && <p className="text-red-500">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(photo => (
                    <div key={photo.id} className="overflow-hidden rounded-lg shadow-lg">
                        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block relative h-60">
                            <Image
                                src={photo.src.medium}
                                alt={photo.alt || photo.photographer}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 hover:scale-105"
                            />
                        </a>
                        <div className="p-4 bg-white">
                            <p className="text-sm text-gray-600">
                                Foto por{' '}
                                <a
                                    href={photo.photographer_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {photo.photographer}
                                </a>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <p className="text-center my-4">Cargando...</p>}

            {hasMore && !loading && (
                <div className="text-center mt-8">
                    <button
                        onClick={loadMore}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Cargar más
                    </button>
                </div>
            )}

            {!hasMore && photos.length > 0 && (
                <p className="text-center my-4 text-gray-600">No hay más imágenes para mostrar</p>
            )}

            {!loading && photos.length === 0 && !error && (
                <p className="text-center my-4">No se encontraron imágenes para esta búsqueda</p>
            )}
        </div>
    );
}