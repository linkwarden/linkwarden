module.exports.port = process.env.PORT || 5000;
module.exports.URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
module.exports.database = process.env.DB_NAME || 'sample_db';
module.exports.collection = process.env.COLLECTION_NAME || 'list';
const storageLocation = process.env.STORAGE_LOCATION || '/media';
module.exports.screenshotDirectory = storageLocation + '/screenshots';
module.exports.pdfDirectory = storageLocation + '/pdfs';
