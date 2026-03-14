export class MemoryLogger {
  public logs: { timestamp: string; message: string; data?: any }[] = [];

  constructor(private maxLogs = 50) {}

  public info(message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: `[INFO] ${message}`,
      data,
    };
    
    // Log to standard console
    if (data) console.info(entry.message, data);
    else console.info(entry.message);

    // Store in memory feed
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.pop();
    }
  }

  public getFeed() {
    return this.logs;
  }

  private pop() {
    this.logs.pop();
  }
}

export const appLogger = new MemoryLogger();
