module.exports.port = process.env.PORT || 5000;
module.exports.URI = process.env.MONGODB_URI || "mongodb://localhost:27017"; // URI
module.exports.database = process.env.DB_NAME || "sample_db"; // Database name
module.exports.collection = process.env.COLLECTION_NAME || "list"; // Collection name
const storageLocation = process.env.STORAGE_LOCATION || "./media";
module.exports.screenshotDirectory = storageLocation + "/screenshots";
module.exports.pdfDirectory = storageLocation + "/pdfs";
