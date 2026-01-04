// EM: migracao.js (na raiz do projeto)

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

async function rodarMigracao() {
  try {
    await client.connect();
    const db = client.db('marketplace');
    const pedidosCollection = db.collection('pedidos');
    const usuariosCollection = db.collection('usuarios');

    console.log('🚀 Iniciando migração de dados dos pedidos...');

    // 1. Encontra todos os pedidos que NÃO têm o campo 'produtos.vendedor.id'
    const pedidosAntigos = await pedidosCollection.find({
      'produtos.vendedor.id': { $exists: false }
    }).toArray();

    if (pedidosAntigos.length === 0) {
      console.log('✅ Nenhum pedido antigo para migrar. Sua base de dados já está atualizada!');
      return;
    }

    console.log(`🔎 Encontrados ${pedidosAntigos.length} pedidos com a estrutura antiga.`);

    let pedidosAtualizados = 0;

    // 2. Itera sobre cada pedido antigo
    for (const pedido of pedidosAntigos) {
      let precisaAtualizar = false;
      
      // 3. Itera sobre os produtos de cada pedido
      for (const produto of pedido.produtos) {
        // Se o produto não tem 'vendedor.id', mas tem 'vendedorEmail'
        if (!produto.vendedor?.id && produto.vendedorEmail) {
          // Encontra o usuário (vendedor) correspondente a esse email
          const vendedor = await usuariosCollection.findOne({ email: produto.vendedorEmail });
          
          if (vendedor) {
            // Se encontrou o vendedor, adiciona o ID dele ao objeto
            if (!produto.vendedor) produto.vendedor = {}; // Garante que o objeto vendedor exista
            produto.vendedor.id = vendedor._id.toString(); // Adiciona o ID como string
            precisaAtualizar = true;
            console.log(`   - Adicionando ID ao produto "${produto.nome}" no pedido ${pedido._id}`);
          }
        }
      }

      // 4. Se alguma alteração foi feita, atualiza o documento inteiro no banco
      if (precisaAtualizar) {
        await pedidosCollection.updateOne(
          { _id: pedido._id },
          { $set: { produtos: pedido.produtos } }
        );
        pedidosAtualizados++;
      }
    }

    console.log(`✅ Migração concluída! ${pedidosAtualizados} pedidos foram atualizados com sucesso.`);

  } catch (error) {
    console.error('❌ ERRO DURANTE A MIGRAÇÃO:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão com o banco de dados fechada.');
  }
}

// Roda a função
rodarMigracao();
