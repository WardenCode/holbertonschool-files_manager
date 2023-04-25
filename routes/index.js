import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const routingController = (app) => {
  const router = express.Router();
  app.use('/', router);

  router.get('/status', AppController.getStatus);
  router.get('/stats', AppController.getStats);

  router.post('/users', UsersController.postNew);
};

export default routingController;
