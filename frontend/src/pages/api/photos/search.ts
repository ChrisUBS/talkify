import { NextApiRequest, NextApiResponse } from 'next';
import { searchPhotos } from '../../../services/pexelsService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const { query, page = '1', perPage = '10' } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Se requiere un parámetro de búsqueda' });
    }

    try {
        const photos = await searchPhotos(
            query,
            parseInt(page as string),
            parseInt(perPage as string)
        );
        return res.status(200).json(photos);
    } catch (error) {
        console.error('Error en el endpoint de búsqueda:', error);
        return res.status(500).json({ message: 'Error al buscar fotos' });
    }
}