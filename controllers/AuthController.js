// AuthController.js

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db').default;
const redisClient = require('../utils/redis').default;

class AuthController {
  static async getConnect(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const base64 = authHeader.split(' ')[1];
      if (!base64) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = Buffer.from(base64, 'base64').toString();
      const [email, password] = decoded.split(':');

      if (!email || !password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user || user.password !== sha1(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      redisClient.set(`auth_${token}`, user._id.toString(), 86400);

      return res.status(200).json({ token });
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
module.exports = AuthController;
