import { NowRequest, NowResponse } from "@vercel/node";
import { MongoClient, Db } from "mongodb";
import url from "url";

// RouteStart -> guarda no cache a conexão, desliga depois de um tempo caso n tenha tido acesso
// Sem o RouteStart, a cada 1000 requisições, 1000 conexões com o banco serão feitas
// com o cache, irá compartilhar a conexão
let cacheDb: Db = null;

async function connectToDatabase(uri: string) {
  if (cacheDb) {
    return cacheDb;
  }
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const dbName = url.parse(uri).pathname.substr(1);

  const db = client.db(dbName);

  cacheDb = db;

  return db;
}

export default async (request: NowRequest, response: NowResponse) => {
  const { email } = request.body;

  const db = await connectToDatabase(process.env.MONGODB_URI);

  const collections = db.collection("subscribers");

  await collections.insertOne({
    email,
    subscribeAt: new Date(),
  });

  return response
    .status(201)
    .json({ message: `E-mail ${email} cadastrado com sucesso` });
};
