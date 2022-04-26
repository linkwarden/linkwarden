const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');

const port = process.env.PORT || 3001;

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

app.use(express.json());

app.get('/get', async (req, res) => {
  const data = await getDoc();
  res.send(data);
});

app.post('/post', (req, res) => {
  let title;
  const pageToVisit = req.body.link;
  request(pageToVisit, (error, response, body) => {
    if(response.statusCode === 200) {
      // Parse the document body
      const $ = cheerio.load(body);

      req.body.title = $('title').text();
      insertDoc(req.body);
    }
  });
});

app.delete('/delete', async (req, res) => {
  const id = req.body.id.toString();

  await deleteDoc(id);

  res.send(`Bookmark with ObjectId "${id}" deleted.`);
});

async function insertDoc(doc) {
  try {
    await client.connect();

    const database = client.db("sample_db");
    const list = database.collection("list");
    const result = await list.insertOne(doc);
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

async function deleteDoc(doc) {
  try {
    await client.connect();

    const database = client.db("sample_db");
    const list = database.collection("list");
    const result = await list.deleteOne({"_id": ObjectId(doc)});
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