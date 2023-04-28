import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const unauthorizedError = {
  error: 'Unauthorized',
};

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).send(unauthorizedError);
    }

    const userDataBase64 = authorization.split(' ')[1];
    const userDataBuffer = Buffer.from(userDataBase64, 'base64');
    const [email, password] = userDataBuffer.toString().split(':');
    const userObj = {
      email,
      password: sha1(password),
    };

    const user = await dbClient.users.findOne(userObj);

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    const sesionExists = Boolean(await redisClient.get(`auth_${token}`));

    if (!token || !sesionExists) {
      return res.status(401).send(unauthorizedError);
    }

    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

export default AuthController;
