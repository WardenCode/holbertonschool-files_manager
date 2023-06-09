import { env } from 'process';
import express from 'express';
import routingController from './routes/index';

const PORT = env.PORT || 5000;

const app = express();

app.use(express.json());
routingController(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
