// FilesController.js

const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db').default;
const redisClient = require('../utils/redis').default;

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { name, type, parentId = '0', isPublic = false, data } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }
      let parent = null;
      if (parentId !== '0') {
        if (!ObjectId.isValid(parentId)) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        parent = await dbClient.db.collection('files').findOne({
          _id: new ObjectId(parentId),
        });
        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      const fileDoc = {
        userId,
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : parentId,
      };
      if (type !== 'folder') {
        const folderPath = 
		  process.env.FOLDER_PATH || '/tmp/files_manager';
		fs.mkdirSync(folderPath, { recursive: true });
		const localPath = path.join(folderPath, new ObjectId().toString());
		fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
		fileDoc.localPath = localPath;
      }
      const result = await dbClient.db.collection('files').insertOne(fileDoc);
      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : parentId,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = FilesController;
