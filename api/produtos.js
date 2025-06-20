import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const db = client.db("marketplace");

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nome, preco, descricao } = req.body;

    try {
      await client.connect();
      const db = client.db("marketplace");
      const collection = db.collection("produtos");

      const produto = { nome, preco, descricao };
      const result = await collection.insertOne(produto);

      res.status(201).json({ message: "Produto cadastrado", id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Erro ao cadastrar produto", error });
    }
  }

  if (req.method === "GET") {
    try {
      await client.connect();
      const db = client.db("marketplace");
      const collection = db.collection("produtos");

      const produtos = await collection.find().toArray();

      res.status(200).json(produtos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar produtos", error });
    }
  }
}
