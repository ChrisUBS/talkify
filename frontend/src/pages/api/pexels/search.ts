// pages/api/pexels/search.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const { query, page = '1', perPage = '10' } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Se requiere un término de búsqueda' });
    }

    const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

    if (!PEXELS_API_KEY) {
        return res.status(500).json({ message: 'API key de Pexels no configurada' });
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
            {
                headers: {
                    Authorization: PEXELS_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error en la respuesta de Pexels: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al buscar imágenes en Pexels:', error);
        return res.status(500).json({ message: 'Error al comunicarse con la API de Pexels' });
    }
}
