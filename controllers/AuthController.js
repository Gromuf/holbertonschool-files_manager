// AuthController.js

import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.mjs';
import redisClient from '../utils/redis.mjs';

class AuthController {
  static async getConnect(req, res) {
    if (!dbClient.db) {
      // <-- AJOUTÉ (Mongo pas encore prêt)
      return res.status(401).json({ error: 'Unauthorized' }); // <-- AJOUTÉ
    }
	if (!dbClient.isAlive()) {
      return res.status(500).json({ error: 'Database not ready' });
    }
	const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'ascii'
    );
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ email });
    if (!user || user.password !== sha1(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
	const token = uuidv4();
	await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    return res.status(200).json({ id: user._id, email: user.email });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(key);
    return res.status(204).end();
  }
}
export default AuthController;
