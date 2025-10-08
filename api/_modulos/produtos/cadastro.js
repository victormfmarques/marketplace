import dotenv from 'dotenv';
dotenv.config();
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// DEBUG: Verificar todas as variáveis de ambiente
console.log('=== DEBUG VARIÁVEIS DE AMBIENTE ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NÃO DEFINIDA');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NÃO DEFINIDA');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NÃO DEFINIDA');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');

// Tentar configurar Cloudinary de múltiplas formas
try {
  // Método 1: Se CLOUDINARY_URL existe, a biblioteca usa automaticamente
  if (process.env.CLOUDINARY_URL) {
    console.log('Usando CLOUDINARY_URL automática');
    // Não precisa chamar config(), a biblioteca detecta automaticamente
  } 
  // Método 2: Configuração manual com variáveis separadas
  else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('Configurando Cloudinary com variáveis separadas');
    cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET 
    });
  } else {
    console.log('Nenhuma configuração do Cloudinary encontrada');
  }
  
  // Verificar configuração final
  console.log('Configuração Cloudinary final:', {
    cloud_name: cloudinary.config().cloud_name || 'NÃO CONFIGURADO',
    api_key: cloudinary.config().api_key ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
  });
  
} catch (error) {
  console.error('Erro na configuração do Cloudinary:', error);
}

export default async function handler(req, res) {
  console.log('=== INICIANDO CADASTRO DE PRODUTO ===');
  console.log('Método:', req.method);
  console.log('Body recebido:', {
    usuarioId: req.body?.usuarioId,
    nome: req.body?.nome,
    categoria: req.body?.categoria,
    fotosCount: req.body?.fotosBase64?.length || 0
  });

  if (req.method === 'POST') {
    try {
      // Verificar se Cloudinary está configurado ANTES de prosseguir
      if (!cloudinary.config().cloud_name && !process.env.CLOUDINARY_URL) {
        console.error('Cloudinary não configurado - cloud_name:', cloudinary.config().cloud_name);
        return res.status(500).json({ 
          success: false, 
          error: 'Serviço de imagens não configurado',
          details: 'Cloudinary não está configurado corretamente'
        });
      }

      await client.connect();
      console.log('Conectado ao MongoDB');
      
      const db = client.db('marketplace');
      const { usuarioId, nome, descricao, preco, categoria, fotosBase64 } = req.body;

      // 1. Upload das imagens para o Cloudinary
      console.log('Iniciando upload de imagens...');
      const fotosUrls = [];
      
      if (fotosBase64 && fotosBase64.length > 0) {
        for (let i = 0; i < fotosBase64.length; i++) {
          console.log(`Upload imagem ${i + 1}/${fotosBase64.length}`);
          try {
            const result = await cloudinary.uploader.upload(fotosBase64[i], {
              folder: 'eco-marketplace'
            });
            fotosUrls.push(result.secure_url);
            console.log(`Imagem ${i + 1} upload OK:`, result.secure_url);
          } catch (uploadError) {
            console.error(`Erro no upload da imagem ${i + 1}:`, uploadError);
            throw uploadError;
          }
        }
      } else {
        console.log('Nenhuma imagem para upload');
      }

      // 2. Busca o e-mail do vendedor
      console.log('Buscando vendedor:', usuarioId);
      const vendedor = await db.collection('usuarios').findOne({ _id: new ObjectId(usuarioId) });
      if (!vendedor) {
        console.log('Vendedor não encontrado:', usuarioId);
        return res.status(404).json({ success: false, error: 'Usuário vendedor não encontrado' });
      }
      console.log('Vendedor encontrado:', vendedor.email);

      // 3. Salva o produto no MongoDB
      console.log('Salvando produto no banco...');
      const produto = {
        usuarioId: new ObjectId(usuarioId),
        nome,
        descricao,
        preco: parseFloat(preco),
        categoria,
        fotos: fotosUrls,
        dataCadastro: new Date(),
        status: 'ativo',
        vendedorEmail: vendedor.email
      };

      const result = await db.collection('produtos').insertOne(produto);
      console.log('Produto salvo com ID:', result.insertedId);

      res.status(201).json({
        success: true,
        produto: { ...produto, _id: result.insertedId }
      });

    } catch (error) {
      console.error('Erro completo ao cadastrar produto:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: 'Erro no processo de cadastro do produto'
      });
    } finally {
      await client.close();
      console.log('Conexão MongoDB fechada');
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}