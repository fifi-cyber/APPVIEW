const db = require('../../db');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Ejemplo de consulta a la base de datos
            const result = await db.query('SELECT NOW()');
            res.status(200).json({ message: 'Base de datos conectada correctamente', time: result.rows[0].now });
        } catch (error) {
            console.error('Error conectando a la base de datos:', error);
            res.status(500).json({ error: 'Error conectando a la base de datos' });
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}
