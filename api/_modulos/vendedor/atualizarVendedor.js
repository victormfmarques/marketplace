// api/_modulos/vendedor/atualizarVendedor.js

import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

const uri = process.env.MONGODB_URI;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const form = formidable({});
  let client;

  try {
    const [fields, files] = await form.parse(req);

    const userId = fields.userId?.[0];
    const sobre = fields.sobre?.[0];
    const removerFoto = fields.removerFoto?.[0];
    const fotoFile = files.foto?.[0];

    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    const updateData = {};

    // SOBRE (aceita string vazia)
    if (sobre !== undefined) {
      updateData.sobre = sobre;
    }

    // REMOVER FOTO
    if (removerFoto === 'true') {
      updateData.fotoPerfil = null;
    }

    // UPLOAD DE FOTO (somente se não estiver removendo)
    if (fotoFile && removerFoto !== 'true') {
      try {
        const result = await cloudinary.uploader.upload(fotoFile.filepath, {
          folder: 'perfis_vendedores',
          public_id: userId,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        });
        updateData.fotoPerfil = result.secure_url;
      } catch (uploadError) {
        return res.status(500).json({
          message: 'Falha no upload da imagem.',
          error: uploadError.message
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma alteração para salvar.'
      });
    }

    client = new MongoClient(uri);
    await client.connect();
    const db = client.db('marketplace');

    await db.collection('usuarios').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    const usuarioAtualizado = await db.collection('usuarios').findOne(
      { _id: new ObjectId(userId) },
      { projection: { senha: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: usuarioAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil do vendedor:', error);
    return res.status(500).json({
      message: 'Erro no servidor ao atualizar perfil.'
    });
  } finally {
    if (client) await client.close();
  }
}