// api/_modulos/produtos/editar.js
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({ url: process.env.CLOUDINARY_URL });

const client = new MongoClient(process.env.MONGODB_URI);

export async function produtosEditarHandler(req, res) {
  const produtoId = req.query.id;
  const usuarioLogado = JSON.parse(req.headers['x-usuario'] || '{}');

  if (!produtoId || !ObjectId.isValid(produtoId)) 
    return res.status(400).json({ error: 'Produto não especificado ou ID inválido' });

  if (!usuarioLogado?._id) 
    return res.status(401).json({ error: 'Usuário não logado' });

  try {
    await client.connect();
    const db = client.db('marketplace');

    const produto = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

    // Apenas dono ou admin
    if (produto.usuarioId.toString() !== usuarioLogado._id && usuarioLogado.cargo !== 'administrador') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
      const { senha } = req.body;
      if (!senha) return res.status(400).json({ error: 'Senha obrigatória para exclusão' });

      const usuarioDb = await db.collection('usuarios').findOne({ _id: new ObjectId(usuarioLogado._id) });
      if (!usuarioDb) return res.status(404).json({ error: 'Usuário não encontrado' });

      const senhaValida = await bcrypt.compare(senha, usuarioDb.senha);
      if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

      // Deletar foto do Cloudinary
      if (produto.fotos?.length) {
        const foto = produto.fotos[0]; // apenas 1 foto
        if (foto.public_id) {
          try { await cloudinary.uploader.destroy(foto.public_id); } catch(e){ console.error(e); }
        }
      }

      await db.collection('produtos').deleteOne({ _id: new ObjectId(produtoId) });
      return res.status(200).json({ success: true, message: 'Produto excluído com sucesso' });
    }

    // --- POST: editar produto ---
    if (req.method === 'POST') {
      const { nome, descricao, preco, categoria, fotoBase64 } = req.body;

      if (!nome || !descricao || !preco || !categoria) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }

      const updateData = {
        nome,
        descricao,
        preco: Number(preco),
        categoria
      };

      // Atualizar foto se houver
      if (fotoBase64) {
        // Apaga foto antiga
        if (produto.fotos?.length) {
          const oldFoto = produto.fotos[0];
          if (oldFoto.public_id) {
            try { await cloudinary.uploader.destroy(oldFoto.public_id); } catch(e){ console.error(e); }
          }
        }

        // Upload nova foto
        const result = await cloudinary.uploader.upload(fotoBase64, { folder: 'eco-marketplace' });
        updateData.fotos = [{ url: result.secure_url, public_id: result.public_id }];
      }

      await db.collection('produtos').updateOne(
        { _id: new ObjectId(produtoId) },
        { $set: updateData }
      );

      return res.status(200).json({ success: true, message: 'Produto atualizado com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err) {
    console.error('Erro no editar produto:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    await client.close();
  }
}