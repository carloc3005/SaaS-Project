// Simple request queue to help manage OpenAI rate limits
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly delay: number;

  constructor(delayBetweenRequests = 5000) { // 5 second delay between requests
    this.delay = delayBetweenRequests;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        
        // Wait before processing next request (unless it's the last one)
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    }

    this.isProcessing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Global request queue instance
export const agentRequestQueue = new RequestQueue(3000); // 3 seconds between requests
