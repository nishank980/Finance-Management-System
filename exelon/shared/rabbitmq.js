const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
    this.connection = await amqp.connect(rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    
    // Create topic exchange for selective routing
    await this.channel.assertExchange('finance.events', 'topic', { durable: true });
  }

  async publish(routingKey, message) {
    // Publish with routing key for selective delivery
    this.channel.publish('finance.events', routingKey, Buffer.from(JSON.stringify({
      routingKey,
      data: message,
      timestamp: Date.now()
    })), { persistent: true });
  }

  async subscribe(serviceName, routingPatterns, callback) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    // Create persistent queue for service
    const queue = `${serviceName}.queue`;
    
    await this.channel.assertQueue(queue, { 
      durable: true,
      exclusive: false,
      autoDelete: false
    });
    
    // Bind to multiple routing patterns
    for (const pattern of routingPatterns) {
      await this.channel.bindQueue(queue, 'finance.events', pattern);
    }
    
    await this.channel.prefetch(1);
    
    this.channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel.ack(msg);
      }
    });
  }
}

module.exports = new RabbitMQ();