// redis.mjs
import Redis from 'redis';

class RedisClient {
  constructor() {
    this.client = Redis.createClient();

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    });
  }

  set(key, value, duration) {
    return new Promise((resolve, reject) => {
      if (duration) {
        this.client.set(key, value, 'EX', duration, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        this.client.set(key, value, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
const redisClient = new RedisClient();
export default redisClient;
