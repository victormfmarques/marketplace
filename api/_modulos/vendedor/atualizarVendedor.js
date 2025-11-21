// api/_modulos/vendedor/atualizarVendedor.js

import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable'; // Para processar o formulário com imagem

const uri = process.env.MONGODB_URI;

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Desativa o bodyParser padrão do Next.js para esta rota, pois o formidable vai cuidar disso
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    // --- LOG PARA VERIFICAR VARIÁVEIS DE AMBIENTE ---
    console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Carregado' : 'NÃO CARREGADO');
    console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY ? 'Carregado' : 'NÃO CARREGADO');
    console.log('Cloudinary API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Carregado' : 'NÃO CARREGADO');

    const form = formidable({});
    
    try {
        const [fields, files] = await form.parse(req);
        
        const userId = fields.userId?.[0];
        const sobre = fields.sobre?.[0];
        const fotoFile = files.foto?.[0];

        if (!userId) {
            return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
        }

        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('marketplace');

        const updateData = {};

        // 1. Se houver um texto "sobre", adiciona ao objeto de atualização
        if (sobre) {
            updateData.sobre = sobre;
        }

        // --- BLOCO DE UPLOAD COM DEBUG ---
        if (fotoFile) {
            console.log('Arquivo de foto recebido:', fotoFile.originalFilename);
            try {
                const result = await cloudinary.uploader.upload(fotoFile.filepath, {
                    folder: 'perfis_vendedores',
                    public_id: userId,
                    overwrite: true,
                    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
                });
                console.log('Upload para Cloudinary bem-sucedido:', result.secure_url);
                updateData.fotoPerfil = result.secure_url;
            } catch (uploadError) {
                // ESTE É O LOG MAIS IMPORTANTE
                console.error('ERRO NO UPLOAD PARA O CLOUDINARY:', uploadError);
                // Retorna um erro específico para o frontend saber o que deu errado
                return res.status(500).json({ message: 'Falha no upload da imagem.', error: uploadError.message });
            }
        }

        // 2. Se houver um arquivo de foto, faz o upload para o Cloudinary
        if (fotoFile) {
            const result = await cloudinary.uploader.upload(fotoFile.filepath, {
                folder: 'perfis_vendedores', // Organiza em uma pasta no Cloudinary
                public_id: userId, // Usa o ID do usuário como nome do arquivo (sobrescreve o anterior)
                overwrite: true,
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            });
            updateData.fotoPerfil = result.secure_url; // Salva a URL segura da imagem
        }

        // 3. Se não houver nada para atualizar, retorna sucesso
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ success: true, message: 'Nenhuma alteração para salvar.' });
        }

        // 4. Atualiza o documento do usuário no MongoDB
        await db.collection('usuarios').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        await client.close();
        res.status(200).json({ success: true, message: 'Perfil atualizado com sucesso!', data: updateData });

    } catch (error) {
        console.error('Erro ao atualizar perfil do vendedor:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar perfil.' });
    }
}