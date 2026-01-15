// worker.js

const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db').default;
const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
	throw new Error('Missing fileId');
  }
  if (!userId) {
	throw new Error('Missing userId');
  }
  const file = await dbClient.db.collection('files').findOne({
	_id: new ObjectId(fileId),
	userId,
  });
  if (!file) {
	throw new Error('File not found');
  }
  const sizes = [500, 250, 100];
  for (const size of sizes) {
	const thumbnail = await imageThumbnail(file.localPath, { width: size });
	fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  }
});
