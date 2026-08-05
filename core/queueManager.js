class QueueManager {
  constructor(maxActive = 3) {
    this.queue = [];
    this.active = 0;
    this.maxActive = maxActive;
    this.isProcessing = false; // Re-entry lock
  }

  add(task) {
    if (typeof task !== 'function') {
      throw new TypeError('Task must be a function');
    }
    this.queue.push(task);
    this.process();
  }

  // BUG #7 FIX: isProcessing re-entry lock hataya — yeh queue ko drain hone se rok raha tha
  // Ab seedha loop chalti hai, har task complete hone pe dobara process() call hoti hai
  process() {
    while (this.queue.length > 0 && this.active < this.maxActive) {
      const task = this.queue.shift();
      this.active++;

      // Fire task without awaiting taaki concurrency bani rahe
      task()
        .catch((err) => {
          console.error("Task failed:", err);
        })
        .finally(() => {
          this.active--;
          this.process(); // slot free hone pe next task lo
        });
    }
  }

  get status() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxActive: this.maxActive,
    };
  }
}

module.exports = new QueueManager();
