import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
    maxPoolSize: 5,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000
};

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;

    const client = new MongoClient(uri, options);
    await client.connect();
    cachedClient = client;
    return client;
}

export default async function handler(req, res) {
    try {
        const client = await connectToDatabase();
        const db = client.db('marketplace');

        const id = req.query.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID do produto inválido' });
        }

        const pipeline = [
            { $match: { _id: new ObjectId(id) } },
            {
                $addFields: {
                    usuarioObjectId: { $toObjectId: "$usuarioId" }
                }
            },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'usuarioObjectId',
                    foreignField: '_id',
                    as: 'usuario'
                }
            },
            {
                $unwind: {
                    path: '$usuario',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const resultado = await db.collection('produtos').aggregate(pipeline).toArray();
        const produto = resultado[0];

        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // ✅ Incrementa visualizações
        await db.collection('produtos').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { visualizacoes: 1 } }
        );
        
        const fotos = Array.isArray(produto.fotos)
            ? produto.fotos.map(foto =>
                foto.startsWith('http') ? foto
                : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${foto}`
            )
            : ['/assets/img/placeholder.png'];

        const produtoFormatado = {
            _id: produto._id.toString(),
            nome: produto.nome || 'Produto sem nome',
            descricao: produto.descricao || 'Sem descrição',
            preco: parseFloat(
                (produto.preco || 0)
                    .toString()
                    .replace(',', '.')
                    .replace(/[^0-9.]/g, '')
            ),
            fotos,
            usuarioId: produto.usuarioId || null,
            categoria: produto.categoria || 'geral',
            vendedor: {
                nome: produto.usuario?.nome || 'Vendedor',
                email: produto.usuario?.email || 'Email não informado',
                telefone: produto.usuario?.telefone || 'Telefone não informado'
            }
        };

        res.status(200).json(produtoFormatado);

    } catch (error) {
        console.error('Erro na API detalhes:', error);
        res.status(500).json({
            error: 'Erro interno no servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
}