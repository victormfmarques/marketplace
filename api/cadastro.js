import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nome, email, senha } = req.body;

    try {
      await client.connect();
      const db = client.db("marketplace");
      const collection = db.collection("usuarios");

      const usuario = { nome, email, senha };
      const result = await collection.insertOne(usuario);

      res.status(201).json({ message: "Usuário cadastrado", id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Erro ao cadastrar usuário", error });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
