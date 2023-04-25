import express from 'express';
import AppController from '../controllers/AppController';

const routingController = (app) => {
  const router = express.Router();
  app.use('/', router);

  router.get('/status', AppController.getStatus);
  router.get('/stats', AppController.getStats);
};

export default routingController;
