// EM: api/modelus/vendedor/listarPedidos.js

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const client = new MongoClient(process.env.MONGODB_URI);
const ITENS_POR_PAGINA = 10;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: `Método ${req.method} não permitido` });
    }

    const { id: vendedorId, pagina = 1, status = 'todos' } = req.query;

    if (!vendedorId) {
        return res.status(400).json({ message: 'ID do vendedor é obrigatório.' });
    }

    try {
        await client.connect();
        const db = client.db('marketplace');

        // =================================================================
        //      A LÓGICA CORRETA, FINALMENTE
        // =================================================================

        // 1. Encontrar TODOS os IDs dos produtos que pertencem a este vendedor.
        const produtosDoVendedor = await db.collection('produtos').find(
            { usuarioId: new ObjectId(vendedorId) },
            { projection: { _id: 1 } } // Pega apenas o campo _id
        ).toArray();

        // Se o vendedor não tem produtos, ele não pode ter pedidos.
        if (produtosDoVendedor.length === 0) {
            return res.status(200).json({
                pedidos: [],
                totalPedidos: 0,
                paginaAtual: 1,
                totalPaginas: 0
            });
        }

        // Converte o array de objetos para um array de strings de IDs.
        const idsDosProdutosDoVendedor = produtosDoVendedor.map(p => p._id.toString());

        // 2. Agora, construímos a query para buscar os pedidos.
        const matchQuery = {
            'produtos.id': { $in: idsDosProdutosDoVendedor } // A MÁGICA: Busca pedidos onde o array 'produtos' tenha um 'id' que ESTEJA NA NOSSA LISTA.
        };

        if (status !== 'todos') {
            matchQuery.status = status;
        }

        const paginaAtual = parseInt(pagina, 10);
        const skip = (paginaAtual - 1) * ITENS_POR_PAGINA;

        // 3. Buscamos e processamos os pedidos.
        const pipeline = [
            { $match: matchQuery },
            { $sort: { dataPedido: -1 } },
            { $skip: skip },
            { $limit: ITENS_POR_PAGINA },
            { $lookup: { from: 'usuarios', localField: 'usuarioId', foreignField: '_id', as: 'compradorInfo' } },
            { $unwind: '$compradorInfo' }
        ];

        const pedidosEncontrados = await db.collection('pedidos').aggregate(pipeline).toArray();
        const totalPedidos = await db.collection('pedidos').countDocuments(matchQuery);

        // Filtra os produtos DENTRO de cada pedido para mostrar apenas os do vendedor.
        const pedidosFinais = pedidosEncontrados.map(pedido => {
            const produtosFiltrados = pedido.produtos.filter(p => idsDosProdutosDoVendedor.includes(p.id));
            return {
                ...pedido,
                produtos: produtosFiltrados,
                total: produtosFiltrados.reduce((acc, prod) => acc + (prod.preco * prod.quantidade), 0)
            };
        });

        res.status(200).json({
            pedidos: pedidosFinais,
            totalPedidos: totalPedidos,
            paginaAtual: paginaAtual,
            totalPaginas: Math.ceil(totalPedidos / ITENS_POR_PAGINA)
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedidos para o vendedor:', error);
        res.status(500).json({ error: 'Erro interno.' });
    } finally {
        await client.close();
    }
}