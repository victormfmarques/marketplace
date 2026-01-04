import dotenv from 'dotenv';
dotenv.config();

import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const client = new MongoClient(process.env.MONGODB_URI);

cloudinary.config({
  url: process.env.CLOUDINARY_URL
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let fotosUrls = [];

  try {
    await client.connect();
    const db = client.db('marketplace');

    const { usuarioId, nome, descricao, preco, categoria, fotosBase64 } = req.body;

    // ===== Validações básicas =====
    if (
      !usuarioId ||
      !nome?.trim() ||
      !descricao?.trim() ||
      !categoria?.trim() ||
      !preco
    ) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    const precoNumero = Number(preco);
    if (isNaN(precoNumero) || precoNumero <= 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    if (!Array.isArray(fotosBase64) || fotosBase64.length === 0) {
      return res.status(400).json({ error: 'Envie ao menos uma imagem' });
    }

    if (fotosBase64.length > 5) {
      return res.status(400).json({ error: 'Máximo de 5 imagens por produto' });
    }

    // ===== Buscar vendedor =====
    const vendedor = await db.collection('usuarios').findOne({
      _id: new ObjectId(usuarioId)
    });

    if (!vendedor || vendedor.cargo !== 'vendedor') {
      return res.status(403).json({ error: 'Usuário não autorizado' });
    }

    // ===== Verificar limite =====
    const totalProdutos = await db.collection('produtos').countDocuments({
      usuarioId: new ObjectId(usuarioId)
    });

    if (totalProdutos >= 5) {
      return res.status(403).json({
        error: 'Limite de 5 produtos atingido'
      });
    }

    // ===== Upload das imagens =====
    for (const foto of fotosBase64) {
      const result = await cloudinary.uploader.upload(foto, {
        folder: 'eco-marketplace'
      });

      fotosUrls.push({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    // ===== Salvar produto =====
    const produto = {
      usuarioId: new ObjectId(usuarioId),
      nome,
      descricao,
      preco: precoNumero,
      categoria,
      fotos: fotosUrls,
      status: 'ativo',
      dataCadastro: new Date(),
      vendedorEmail: vendedor.email
    };

    const insert = await db.collection('produtos').insertOne(produto);

    return res.status(201).json({
      success: true,
      produto: { ...produto, _id: insert.insertedId }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);

    // 🔥 ROLLBACK CLOUDINARY
    for (const foto of fotosUrls) {
      if (foto.public_id) {
        await cloudinary.uploader.destroy(foto.public_id);
      }
    }

    return res.status(500).json({
      error: 'Erro ao cadastrar produto'
    });

  } finally {
    await client.close();
  }
}