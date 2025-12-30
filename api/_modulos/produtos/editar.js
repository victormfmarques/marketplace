// api/_modulos/produtos/editar.js

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  console.log('=== EDITANDO PRODUTO ===');
  console.log('Método:', req.method);
  console.log('Produto ID:', req.query.id);
  
  const metodo = req.method;
  const produtoId = req.query.id;

  if (!produtoId || !ObjectId.isValid(produtoId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await client.connect();
    const db = client.db('marketplace');

    const headerUsuario = req.headers['x-usuario'];
    if (!headerUsuario) {
      return res.status(400).json({ error: 'Cabeçalho x-usuario ausente' });
    }

    const usuarioLogado = JSON.parse(headerUsuario);

    const produto = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (produto.usuarioId.toString() !== usuarioLogado._id) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // --- PUT: Editar produto ---
    if (metodo === 'PUT') {
      const { nome, descricao, preco, categoria, fotosBase64 } = req.body;
      
      console.log('Dados recebidos:', {
        nome,
        temFotosBase64: !!fotosBase64,
        fotosCount: fotosBase64 ? fotosBase64.length : 0
      });

      if (!nome || !descricao || !preco || !categoria) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }

      // ✅ CONFIGURAR CLOUDINARY
      if (process.env.CLOUDINARY_URL) {
        const url = process.env.CLOUDINARY_URL;
        const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)/);
        
        if (matches) {
          const [, api_key, api_secret, cloud_name] = matches;
          cloudinary.config({ 
            cloud_name, 
            api_key, 
            api_secret, 
            secure: true 
          });
          console.log('Cloudinary configurado para edição');
        }
      }

      let fotosAtualizadas = produto.fotos || [];
      let imagensParaDeletar = [];

      // ✅ SE TEM NOVAS IMAGENS: deletar as antigas primeiro
      if (fotosBase64 && fotosBase64.length > 0) {
        console.log(`Processando ${fotosBase64.length} nova(s) imagem(ns)`);
        
        // Guarda as URLs antigas para deletar depois
        imagensParaDeletar = [...produto.fotos || []];
        
        const novasFotos = [];
        
        for (const base64 of fotosBase64) {
          try {
            // Se já é uma URL (imagem existente), mantém e não marca para deletar
            if (base64.startsWith('http')) {
              novasFotos.push(base64);
              
              // Remove da lista de deletar (pois tá mantendo)
              const index = imagensParaDeletar.indexOf(base64);
              if (index > -1) {
                imagensParaDeletar.splice(index, 1);
              }
              continue;
            }
            
            // É base64 novo, faz upload
            console.log('Fazendo upload de nova imagem...');
            const result = await cloudinary.uploader.upload(base64, {
              folder: 'eco-marketplace'
            });
            novasFotos.push(result.secure_url);
            console.log('✅ Nova imagem uploadada:', result.secure_url);
          } catch (uploadError) {
            console.error('❌ Erro no upload:', uploadError.message);
            // Se falhar, usa placeholder
            novasFotos.push('https://via.placeholder.com/400x300/ff0000/ffffff?text=Erro+no+Upload');
          }
        }
        
        // Se conseguiu fazer upload de novas, substitui as antigas
        if (novasFotos.length > 0) {
          fotosAtualizadas = novasFotos;
        }
      }

      // ✅ ATUALIZAR PRODUTO COM FOTOS
      const updateData = {
        $set: {
          nome,
          descricao,
          preco: parseFloat(preco),
          categoria,
          fotos: fotosAtualizadas,
          dataAtualizacao: new Date()
        }
      };

      console.log('🔄 Atualizando produto com:', {
        ...updateData.$set,
        fotos: `${fotosAtualizadas.length} imagem(ns)`
      });

      const result = await db.collection('produtos').updateOne(
        { _id: new ObjectId(produtoId) },
        updateData
      );

      console.log('✅ Resultado do update:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });

      // ✅ DELETAR IMAGENS ANTIGAS DO CLOUDINARY (se houver)
      if (imagensParaDeletar.length > 0) {
        console.log(`🗑️  Deletando ${imagensParaDeletar.length} imagem(ns) antiga(s) do Cloudinary...`);
        
        for (const fotoUrl of imagensParaDeletar) {
          if (fotoUrl.includes('cloudinary.com')) {
            try {
              // Extrai o public_id da URL
              const publicId = extrairPublicIdCloudinary(fotoUrl);
              if (publicId) {
                console.log(`Deletando imagem antiga: ${publicId}`);
                const deleteResult = await cloudinary.uploader.destroy(publicId);
                console.log(`✅ Imagem deletada: ${publicId}`, deleteResult.result);
              }
            } catch (deleteError) {
              console.error(`❌ Erro ao deletar imagem ${fotoUrl}:`, deleteError.message);
              // Continua mesmo se falhar
            }
          }
        }
      }

      // Buscar produto atualizado para verificar
      const produtoAtualizado = await db.collection('produtos').findOne({ 
        _id: new ObjectId(produtoId) 
      });

      console.log('📸 Fotos após update:', produtoAtualizado?.fotos);

      return res.status(200).json({ 
        success: true,
        message: 'Produto atualizado com sucesso',
        fotosAtualizadas: fotosAtualizadas.length,
        imagensDeletadas: imagensParaDeletar.length
      });
    }

    // --- DELETE: Excluir produto ---
    if (metodo === 'DELETE') {
      const { senha } = req.body;

      if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória para excluir o produto' });
      }

      const usuarioDb = await db.collection('usuarios').findOne({ _id: new ObjectId(usuarioLogado._id) });
      if (!usuarioDb) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuarioDb.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      // ✅ ANTES DE EXCLUIR: Deletar imagens do Cloudinary
      if (produto.fotos && produto.fotos.length > 0 && process.env.CLOUDINARY_URL) {
        console.log('🗑️  Deletando imagens do Cloudinary...');
        
        try {
          // Configurar Cloudinary (se ainda não estiver)
          if (!cloudinary.config().cloud_name && process.env.CLOUDINARY_URL) {
            const url = process.env.CLOUDINARY_URL;
            const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)/);
            if (matches) {
              const [, api_key, api_secret, cloud_name] = matches;
              cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
            }
          }
          
          // Para cada imagem do produto
          for (const fotoUrl of produto.fotos) {
            if (fotoUrl.includes('cloudinary.com')) {
              // Extrai o public_id da URL do Cloudinary
              const matches = fotoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|webp|gif)/);
              if (matches) {
                const publicId = matches[1];
                console.log(`Deletando imagem: ${publicId}`);
                
                try {
                  const result = await cloudinary.uploader.destroy(publicId);
                  console.log(`✅ Imagem deletada: ${publicId}`, result);
                } catch (deleteError) {
                  console.error(`❌ Erro ao deletar imagem ${publicId}:`, deleteError.message);
                  // Continua mesmo se falhar uma imagem
                }
              }
            }
          }
        } catch (cloudinaryError) {
          console.error('Erro ao configurar Cloudinary para exclusão:', cloudinaryError);
          // Continua a exclusão do produto mesmo se falhar no Cloudinary
        }
      }

      // Agora exclui o produto do MongoDB
      await db.collection('produtos').deleteOne({ _id: new ObjectId(produtoId) });
      
      console.log('✅ Produto excluído do banco de dados');
      return res.status(200).json({ 
        success: true,
        message: 'Produto e imagens excluídos com sucesso'
      });
    }

    // --- Método não permitido ---
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('❌ Erro na API editar/excluir:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    await client.close();
  }
}