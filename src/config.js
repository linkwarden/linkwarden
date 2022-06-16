// Note: the formatting are really sensitive so for example DO NOT end
// the "STORAGE_LOCATION" path with an extra slash "/" (i.e. "/home/")
module.exports = {
  API: {
    ADDRESS: "http://192.168.1.7", // IP address of the computer which LinkWarden is running
    PORT: 5000, // The api port
    MONGODB_URI: "mongodb://localhost:27017", // MongoDB link
    DB_NAME: "sample_db", // MongoDB database name
    COLLECTION_NAME: "list", // MongoDB collection name
    STORAGE_LOCATION: "/home/danny/Documents", // The path to store the archived data
  },
};
