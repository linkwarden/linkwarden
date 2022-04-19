const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 3001;

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

app.use(express.json());

app.get('/get', async (req, res) => {
  const data = await getDoc();
  res.send(data);
});

app.post('/post', (req, res) => {
  // insertDoc(req.body);
  console.log(req.body)
});

async function insertDoc(doc) {
  try {
    await client.connect();

    const database = client.db("sample_db");
    const list = database.collection("list");
    const result = await list.insertOne(doc);

    console.log('DONE');
  } 
  
  catch(err) {
    console.log(err);
  }
  
  finally {
    await client.close();
  }
}

async function getDoc() {
  try {
    await client.connect();

    const database = client.db("sample_db");
    const list = database.collection("list");
    const result = await list.find({}).toArray();

    return result;
  }
  
  catch(err) {
    console.log(err);
  }
  
  finally {
    await client.close();
  }
}

app.listen(port, () => {
  console.log(`Success! running on port ${port}.`);
});