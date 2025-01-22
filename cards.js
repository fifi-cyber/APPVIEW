// /api/cards.js
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM cards ORDER BY id ASC');
            const cards = result.rows;
            client.release();
            res.status(200).json(cards);
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener las tarjetas' });
        }
    } 
    else if (req.method === 'POST') {
        try {
            const { cards } = req.body;
            const client = await pool.connect();
            
            // Primero eliminar todas las tarjetas existentes
            await client.query('TRUNCATE TABLE cards');
            
            // Insertar las nuevas tarjetas
            for (const card of cards) {
                await client.query(
                    'INSERT INTO cards (url, name, category, logo, description) VALUES ($1, $2, $3, $4, $5)',
                    [card.url, card.name, card.category, card.logo, card.description]
                );
            }
            
            client.release();
            res.status(200).json({ message: 'Tarjetas sincronizadas correctamente' });
        } catch (err) {
            res.status(500).json({ error: 'Error al sincronizar las tarjetas' });
        }
    } 
    else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}