import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    const result = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };

    res.status(200).send(result);
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    const result = {
      users,
      files,
    };

    res.status(200).send(result);
  }
}

export default AppController;
