const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const phantom = require('phantom');

const port = process.env.PORT || 3001;

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

app.use(express.json());

app.get('/get', async (req, res) => {
  const data = await getDoc();
  res.send(data);
});

app.post('/post', async (req, res) => {
  const title = await getTitle(req.body.link);
  req.body.title = title;
  
  insertDoc(req.body);
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

async function getTitle(url) {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    console.info('Requesting', requestData.url);
  });

  const status = await page.open(url);
  const title = await page.property('title');  
  await instance.exit();

  return title;
}

app.listen(port, () => {
  console.log(`Success! running on port ${port}.`);
});