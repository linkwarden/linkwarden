const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const cors = require('cors');
const config = require('../src/config.json')

const port = config.server.port;

const uri = config.server.mongodb_full_address;
const database = config.server.database_name;
const collection = config.server.collection_name;

const client = new MongoClient(uri);

app.use(cors());

app.use(express.json());

app.get('/get', async (req, res) => {
  const data = await getDoc();
  res.send(data);
});

app.post('/post', (req, res) => {
  let title;
  const pageToVisit = req.body.link;
  request(pageToVisit, (error, response, body) => {
    try {
      if(response.statusCode === 200) {
        // Parse the document body
        const $ = cheerio.load(body);

        req.body.title = $('title').text();
        insertDoc(req.body);
      } else {
          req.body.title = null;
          insertDoc(req.body);
        } 
      } catch (error) {
        console.log(error);
        req.body.title = null;
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
    const db = client.db(database);
    const list = db.collection(collection);
    const result = await list.insertOne(doc);
  } 
  
  catch(err) {
    console.log(err);
  }
}

async function getDoc() {
  try {
    const db = client.db(database);
    const list = db.collection(collection);
    const result = await list.find({}).toArray();

    return result;
  }
  
  catch(err) {
    console.log(err);
  }
}

async function deleteDoc(doc) {
  try {
    const db = client.db(database);
    const list = db.collection(collection);
    const result = await list.deleteOne({"_id": ObjectId(doc)});

    return result;
  } 
  
  catch(err) {
    console.log(err);
  }
}

app.listen(port, () => {
  console.log(`Success! running on port ${port}.`);
  client.connect();
});