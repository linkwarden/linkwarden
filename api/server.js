const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const cors = require('cors');
const config = require('../src/config.js');
const getData = require('./modules/getData.js');
const fs = require('fs');

const port = config.API.PORT;

const URI = config.API.MONGODB_URI;
const database = config.API.DB_NAME;
const collection = config.API.COLLECTION_NAME;

const client = new MongoClient(URI);

app.use(cors());

app.use(express.json());

app.get('/api', async (req, res) => {
  const data = await getDoc();
  res.send(data);
});

app.get('/screenshots/:id', async (req, res) => {
  res.sendFile(config.API.STORAGE_LOCATION + '/LinkWarden/screenshot\'s/' + req.params.id);
});

app.get('/pdfs/:id', async (req, res) => {
  res.sendFile(config.API.STORAGE_LOCATION + '/LinkWarden/pdf\'s/' + req.params.id);
});

app.post('/api', async (req, res) => {
  const pageToVisit = req.body.link;

  try {
    const dataResult = await getData(pageToVisit, req.body._id);
    req.body.title = dataResult;
    insertDoc(req.body);
  } catch (err) {
    console.log(err);
    insertDoc(req.body);
  } finally {
    res.send('DONE!');
  }
});

app.delete('/api', async (req, res) => {
  const id = req.body.id.toString();

  await deleteDoc(id);

  res.send(`Bookmark with _id:${id} deleted.`);
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
    const result = await list.deleteOne({"_id": doc});

    fs.unlink(config.API.STORAGE_LOCATION + '/LinkWarden/screenshot\'s/' + doc + '.png', (err) => {
      if (err) {
        console.log(err);
      }
    });

    fs.unlink(config.API.STORAGE_LOCATION + '/LinkWarden/pdf\'s/' + doc + '.pdf', (err) => {
      if (err) {
          console.log(err);
      }
    });


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
