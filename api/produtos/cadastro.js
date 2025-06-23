import { v2 as cloudinary } from 'cloudinary';
import { MongoClient } from 'mongodb';

// Configurações com fallback
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'ddfacpcm5',
  api_key: process.env.CLOUDINARY_KEY || '867436943594192',
  api_secret: process.env.CLOUDINARY_SECRET || '0IQojHqri1h_Zq3Vd0B2ubmhBns',
  secure: true
});

const uri = process.env.MONGODB_URI || 'mongodb+srv://victor:manoelvictor14@marketplace.msyyxna.mongodb.net/?retryWrites=true&w=majority&appName=marketplace';
const client = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Conexão com MongoDB
    await client.connect();
    const db = client.db('marketplace');

    // Upload para Cloudinary
    const uploadPromises = req.body.fotosBase64.map(async (foto, index) => {
      try {
        return await cloudinary.uploader.upload(foto, {
          folder: `eco-marketplace/${req.body.usuarioId}`,
          public_id: `produto-${Date.now()}-${index}`,
          quality: 'auto:good'
        });
      } catch (uploadError) {
        console.error(`Erro no upload da foto ${index}:`, uploadError);
        throw uploadError;
      }
    });

    const uploadedPhotos = await Promise.all(uploadPromises);
    const fotoUrls = uploadedPhotos.map(photo => photo.secure_url);

    // Salva no MongoDB
    const produto = {
      ...req.body,
      fotos: fotoUrls,
      dataCadastro: new Date(),
      status: 'ativo'
    };

    delete produto.fotosBase64; // Remove os dados brutos das fotos

    const result = await db.collection('produtos').insertOne(produto);
    
    res.status(201).json({
      success: true,
      produtoId: result.insertedId
    });

  } catch (error) {
    console.error('Erro completo:', error);
    res.status(500).json({
      error: error.message,
      details: {
        cloudinary: process.env.CLOUDINARY_NAME ? 'configurado' : 'faltando',
        mongodb: process.env.MONGODB_URI ? 'configurado' : 'faltando'
      }
    });
  } finally {
    await client.close();
  }
}