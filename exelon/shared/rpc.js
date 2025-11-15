const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQRPC {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.replyQueue = null;
    this.pendingRequests = new Map();
  }

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672');
    this.channel = await this.connection.createChannel();
    
    // Create reply queue for this service
    const q = await this.channel.assertQueue('', { exclusive: true });
    this.replyQueue = q.queue;
    
    // Consume replies
    this.channel.consume(this.replyQueue, (msg) => {
      const correlationId = msg.properties.correlationId;
      const resolver = this.pendingRequests.get(correlationId);
      
      if (resolver) {
        this.pendingRequests.delete(correlationId);
        const response = JSON.parse(msg.content.toString());
        resolver(response);
      }
      
      this.channel.ack(msg);
    });
  }

  async call(queue, data, timeout = 5000) {
    const correlationId = `${Date.now()}_${Math.random()}`;
    
    return new Promise((resolve, reject) => {
      // Store resolver
      this.pendingRequests.set(correlationId, resolve);
      
      // Send request
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
        correlationId,
        replyTo: this.replyQueue
      });
      
      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(correlationId)) {
          this.pendingRequests.delete(correlationId);
          reject(new Error(`RPC timeout for queue: ${queue}`));
        }
      }, timeout);
    });
  }

  async handleRPC(queue, handler) {
    await this.channel.assertQueue(queue);
    
    this.channel.consume(queue, async (msg) => {
      const data = JSON.parse(msg.content.toString());
      const correlationId = msg.properties.correlationId;
      const replyTo = msg.properties.replyTo;
      
      try {
        const result = await handler(data);
        
        // Send reply
        this.channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), {
          correlationId
        });
      } catch (error) {
        // Send error reply
        this.channel.sendToQueue(replyTo, Buffer.from(JSON.stringify({
          error: error.message
        })), { correlationId });
      }
      
      this.channel.ack(msg);
    });
  }
}

module.exports = new RabbitMQRPC();