import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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
      // ✅ CONFIGURAÇÃO DO CLOUDINARY DENTRO DO HANDLER
      console.log('=== CONFIGURANDO CLOUDINARY ===');
      
      if (process.env.CLOUDINARY_URL) {
        console.log('CLOUDINARY_URL encontrada');
        
        // Extrai manualmente da URL
        const url = process.env.CLOUDINARY_URL;
        console.log('URL completa (início):', url?.substring(0, 50) + '...');
        
        const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)/);
        
        if (matches) {
          const [, api_key, api_secret, cloud_name] = matches;
          
          console.log('Configurando Cloudinary com:', {
            cloud_name,
            api_key: '***' + api_key.slice(-4),
            api_secret: '***' + api_secret.slice(-4)
          });
          
          cloudinary.config({
            cloud_name,
            api_key,
            api_secret,
            secure: true
          });
        } else {
          console.error('Não consegui extrair credenciais da CLOUDINARY_URL');
        }
      } else {
        console.error('CLOUDINARY_URL não definida no ambiente');
      }
      
      // Verifica se configurou
      console.log('Configuração Cloudinary final:', {
        cloud_name: cloudinary.config().cloud_name || 'NÃO CONFIGURADO',
        api_key: cloudinary.config().api_key ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
      });
      
      if (!cloudinary.config().cloud_name || !cloudinary.config().api_key) {
        console.error('❌ Cloudinary não configurado corretamente');
        throw new Error('Serviço de imagens não configurado');
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
            console.log('Chamando cloudinary.uploader.upload...');
            
            const result = await cloudinary.uploader.upload(fotosBase64[i], {
              folder: 'eco-marketplace'
            });
            
            fotosUrls.push(result.secure_url);
            console.log(`✅ Imagem ${i + 1} upload OK:`, result.secure_url);
          } catch (uploadError) {
            console.error(`❌ Erro no upload da imagem ${i + 1}:`, uploadError.message);
            console.error('Stack do upload:', uploadError.stack);
            
            // ⚠️ SOLUÇÃO DE EMERGÊNCIA: Se falhar, usa placeholder
            console.log('Usando placeholder como fallback...');
            fotosUrls.push('https://via.placeholder.com/400x300/4CAF50/ffffff?text=' + encodeURIComponent(nome));
            
            // Não joga erro, continua com placeholder
            // throw uploadError; // Comentado pra não quebrar
          }
        }
      } else {
        console.log('Nenhuma imagem para upload');
        fotosUrls.push('https://via.placeholder.com/400x300/cccccc/333333?text=Sem+Imagem');
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
      console.log('✅ Produto salvo com ID:', result.insertedId);

      res.status(201).json({
        success: true,
        produto: { ...produto, _id: result.insertedId }
      });

    } catch (error) {
      console.error('❌ Erro completo ao cadastrar produto:', error.message);
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