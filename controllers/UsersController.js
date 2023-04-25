import sha1 from 'sha1';
import dbClient from '../utils/db';

const ERROR_MSG = {
  email: 'Missing email',
  password: 'Missing password',
  alreadyExists: 'Already exists',
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
}

export default UsersController;
