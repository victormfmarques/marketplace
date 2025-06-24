import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { usuarioId, nome, descricao, preco, categoria, fotosBase64 } = req.body;

  if (!usuarioId || !nome || !descricao || !preco || !categoria || !fotosBase64 || fotosBase64.length === 0) {
    return res.status(400).json({ success: false, message: 'Preencha todos os campos e envie pelo menos uma foto.' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    // Upload das imagens para o Cloudinary
    const fotosUrls = [];
    for (const fotoBase64 of fotosBase64) {
      const result = await cloudinary.uploader.upload(fotoBase64, {
        folder: 'eco-marketplace',
        resource_type: 'image',
        quality: 'auto:good'
      });
      fotosUrls.push(result.secure_url);
    }

    // Cria o objeto do produto
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
    console.error('❌ Erro ao cadastrar produto:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.close();
  }
}
