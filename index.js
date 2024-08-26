import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // Asegúrate de que node-fetch esté instalado
import pkg from 'pg';

const { Pool } = pkg; // Correcto para importación de CommonJS
const app = express();
const port = 3000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'likeme',
    password: '1234',
    port: 5432,
});

// Configurar middleware
app.use(cors({
    origin: 'http://localhost:5173' // Ajusta el puerto según tu configuración de frontend
}));
app.use(express.json());

// Ruta GET para obtener todos los posts
app.get('/posts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Ruta POST para crear un nuevo post
app.post('/posts', async (req, res) => {
  const { titulo, img, descripcion, likes } = req.body;
  try {
      const result = await pool.query(
          'INSERT INTO posts (titulo, img, descripcion, likes) VALUES ($1, $2, $3, $4) RETURNING *',
          [titulo, img, descripcion, likes]
      );
      res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Ruta PUT para actualizar un post
app.put('/posts/:id', async (req, res) => {
    const postId = req.params.id;
    const { titulo, img, descripcion, likes } = req.body;
    try {
        const result = await pool.query(
            'UPDATE posts SET titulo = $1, img = $2, descripcion = $3, likes = $4 WHERE id = $5 RETURNING *',
            [titulo, img, descripcion, likes, postId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Ruta DELETE para eliminar un post
app.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  console.log(`Deleting post with ID: ${postId}`); // Verifica el ID que se está intentando eliminar

  try {
      // La consulta SQL utiliza $1 como parámetro para el ID
      const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [postId]);

      if (result.rows.length === 0) {
          console.log('Post not found'); // Mensaje de depuración
          return res.status(404).json({ message: 'Post no encontrado' });
      }

      console.log('Post deleted:', result.rows[0]); // Mensaje de depuración
      res.json({ message: 'Post eliminado correctamente', post: result.rows[0] });
  } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Solicitud GET con fetch desde Node.js
async function fetchPosts() {
    try {
        const response = await fetch('http://localhost:3000/posts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Fetched posts:', data);
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Llamar a la función fetchPosts 
fetchPosts();

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
