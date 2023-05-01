import Queue from 'bull';
import { writeFile, mkdir, readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const unauthorizedError = {
  error: 'Unauthorized',
};

const FILE_ERROR_MSG = {
  name: 'Missing name',
  type: 'Missing type',
  parentFound: 'Parent not found',
  parentFolder: 'Parent is not a folder',
  data: 'Missing data',
};

class FilesController {
  static async postUpload(req, res) {
    const fileQ = new Queue('fileQ');
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const dir = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!userId) {
      return res.status(401).send(unauthorizedError);
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    const { name, type, data } = req.body;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;

    if (!name) {
      return res.status(400).send({ error: FILE_ERROR_MSG.name });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: FILE_ERROR_MSG.type });
    }

    if (!data && type !== 'folder') {
      return res.status(400).send({ error: FILE_ERROR_MSG.data });
    }

    parentId = parentId === '0' ? 0 : parentId;
    if (parentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).send({ error: FILE_ERROR_MSG.parentFound });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).send({ error: FILE_ERROR_MSG.parentFolder });
      }
    }

    const fileInsertData = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      await dbClient.files.insertOne(fileInsertData);
      return res.status(201).send({
        id: fileInsertData._id,
        ...fileInsertData,
      });
    }

    const fileUid = uuidv4();
    const decData = Buffer.from(data, 'base64');
    const filePath = `${dir}/${fileUid}`;

    mkdir(dir, { recursive: true }, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    writeFile(filePath, decData, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    fileInsertData.localPath = filePath;
    await dbClient.files.insertOne(fileInsertData);

    fileQ.add({
      userId: fileInsertData.userId,
      fileId: fileInsertData._id,
    });

    return res.status(201).send({
      id: fileInsertData._id,
      ...fileInsertData,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send(unauthorizedError);
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    const fileId = req.params.id || '';
    const file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    const {
      name,
      type,
      isPublic,
      parentId,
    } = file;

    return res.status(200).send({
      id: file._id,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send(unauthorizedError);
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    let parentId = req.query.parentId || 0;

    if (parentId === '0') parentId = 0;
    if (parentId !== 0) {
      if (!parentId) return res.status(401).send(unauthorizedError);

      const folder = await dbClient.files.findOne({ _id: ObjectId(parentId) });

      if (!folder || folder.type !== 'folder') return res.status(200).send([]);
    }

    const page = req.query.page || 0;

    const agg = { parentId };
    let aggData = [{ $match: agg }, { $skip: page * 20 }, { $limit: 20 }];
    if (parentId === 0) {
      aggData = [{ $skip: page * 20 }, { $limit: 20 }];
    }

    const pageFiles = await dbClient.files.aggregate(aggData);
    const files = [];

    await pageFiles.forEach((file) => {
      const fileObj = {
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      };
      files.push(fileObj);
    });

    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send(unauthorizedError);
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    const fileId = req.params.id || '';

    let file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });
    file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send(unauthorizedError);
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    const fileId = req.params.id || '';

    let file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const fileId = req.params.id || '';
    const size = req.query.size || 0;

    const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    const { isPublic, userId, type } = file;

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).send(unauthorizedError);
    }

    if ((!isPublic && !user) || (user && userId.toString() !== user && !isPublic)) return res.status(404).send({ error: 'Not found' });
    if (type === 'folder') return res.status(400).send({ error: 'A folder doesn\'t have content' });

    const path = size === 0 ? file.localPath : `${file.localPath}_${size}`;

    try {
      const fileData = readFileSync(path);
      const mimeType = mime.contentType(file.name);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(fileData);
    } catch (err) {
      return res.status(404).send({ error: 'Not found' });
    }
  }
}

export default FilesController;
