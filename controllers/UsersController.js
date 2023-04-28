import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const ERROR_MSG = {
  email: 'Missing email',
  password: 'Missing password',
  alreadyExists: 'Already exist',
};

const unauthorizedError = {
  error: 'Unauthorized',
};

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: ERROR_MSG.email });
    }

    if (!password) {
      return res.status(400).send({ error: ERROR_MSG.password });
    }

    const alreadyExists = await dbClient.users.findOne({ email });

    if (alreadyExists) {
      return res.status(400).send({ error: ERROR_MSG.alreadyExists });
    }

    const hashedPassword = sha1(password);

    const { insertedId } = await dbClient.users.insertOne({
      email,
      password: hashedPassword,
    });

    return res.status(201).send({
      id: insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!token || !userId || !user) {
      return res.status(401).send(unauthorizedError);
    }

    const { _id, email } = user;
    const userInfo = { id: _id, email };

    return res.status(200).send(userInfo);
  }
}

export default UsersController;
