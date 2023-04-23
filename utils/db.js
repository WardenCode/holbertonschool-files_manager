import { MongoClient } from 'mongodb';
import { env } from 'process';

const DB_HOST = env.DB_HOST || 'localhost';
const DB_PORT = env.DB_PORT || 27017;
const DB_DATABASE = env.DB_DATABASE || 'files_manager';
const URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

class DBClient {
  constructor() {
    this.connection = false;
    const connectOptions = {
      useUnifiedTopology: true,
    };

    MongoClient.connect(URI, connectOptions, (error, client) => {
      if (error) {
        console.error(error.message);
      }
      this.connection = true;
      this.db = client.db();
      this.users = this.db.collection('users');
      this.files = this.db.collection('files');
    });
  }

  isAlive() {
    return this.connection;
  }

  async nbUsers() {
    const userCount = await this.users.countDocuments();
    return userCount;
  }

  async nbFiles() {
    const fileCount = await this.files.countDocuments();
    return fileCount;
  }
}

const dbClient = new DBClient();

export default dbClient;
