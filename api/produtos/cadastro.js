import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary'; // Para upload de imagens

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Configure o Cloudinary (serviço gratuito para imagens)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await client.connect();
      const db = client.db('marketplace');
      
      const { usuarioId, nome, descricao, preco, categoria, fotosBase64 } = req.body;

      // 1. Upload das imagens para o Cloudinary
      const fotosUrls = [];
      for (const fotoBase64 of fotosBase64) {
        const result = await cloudinary.uploader.upload(fotoBase64, {
          folder: 'eco-marketplace'
        });
        fotosUrls.push(result.secure_url);
      }

      // 2. Salva o produto no MongoDB
      const produto = {
        usuarioId,
        nome,
        descricao,
        preco: parseFloat(preco),
        categoria,
        fotos: fotosUrls,
        dataCadastro: new Date(),
        status: 'ativo'
      };

      const result = await db.collection('produtos').insertOne(produto);

      res.status(201).json({
        success: true,
        produto: { ...produto, _id: result.insertedId }
      });

    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}