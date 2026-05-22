const mongoose = require('mongoose');

let connectPromise = null;

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
    }).catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  return connectPromise;
}

module.exports = {
  connectDB,
  mongoose,
};
