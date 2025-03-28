import { createClient, PhotosWithTotalResults, ErrorResponse } from 'pexels';
import { PexelsPhotoResponse, PexelsPhoto } from '../types/pexels';

// Configura el cliente con tu API key
const pexelsClient = createClient(process.env.NEXT_PUBLIC_PEXELS_API_KEY || '');

export const searchPhotos = async (
    query: string,
    page: number = 1,
    perPage: number = 10
): Promise<PexelsPhotoResponse> => {
    try {
        const response = await pexelsClient.photos.search({
            query,
            page,
            per_page: perPage
        }) as PhotosWithTotalResults;

        return {
            page: page,
            per_page: perPage,
            photos: response.photos as PexelsPhoto[],
            total_results: response.total_results,
            next_page: response.next_page || '',
            prev_page: response.prev_page || ''
        };
    } catch (error) {
        console.error('Error al buscar fotos en Pexels:', error);
        throw error;
    }
};

export const getCuratedPhotos = async (
    page: number = 1,
    perPage: number = 10
): Promise<PexelsPhotoResponse> => {
    try {
        const response = await pexelsClient.photos.curated({
            page,
            per_page: perPage
        }) as PhotosWithTotalResults;

        return {
            page: page,
            per_page: perPage,
            photos: response.photos as PexelsPhoto[],
            total_results: response.total_results,
            next_page: response.next_page || '',
            prev_page: response.prev_page || ''
        };
    } catch (error) {
        console.error('Error al obtener fotos curadas de Pexels:', error);
        throw error;
    }
};

export const getPhotoById = async (id: number): Promise<PexelsPhoto> => {
    try {
        const photo = await pexelsClient.photos.show({ id }) as PexelsPhoto;
        return photo;
    } catch (error) {
        console.error(`Error al obtener la foto con ID ${id} de Pexels:`, error);
        throw error;
    }
};