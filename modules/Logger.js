const fs = require('fs-extra');
const path = require('path');
const config = require('../config/environment');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info'; // 'debug', 'info', 'warn', 'error'
    this.logToFile = options.logToFile !== false; // Default true
    this.logToConsole = options.logToConsole !== false; // Default true
    this.logDir = options.logDir || config.logsPath;
    this.currentLogFile = null;
    
    // Ensure log directory exists
    if (this.logToFile) {
      fs.ensureDirSync(this.logDir);
      this.currentLogFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    }
  }

  getDateString() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      formatted += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    
    return formatted;
  }

  async writeToFile(message) {
    if (!this.logToFile) return;
    
    try {
      // Check if we need a new log file (new day)
      const currentDate = this.getDateString();
      const expectedLogFile = path.join(this.logDir, `app-${currentDate}.log`);
      
      if (this.currentLogFile !== expectedLogFile) {
        this.currentLogFile = expectedLogFile;
      }
      
      await fs.appendFile(this.currentLogFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async log(level, message, data = null) {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, data);
    
    // Log to console
    if (this.logToConsole) {
      switch (level) {
        case 'error':
          console.error(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'debug':
          console.debug(formatted);
          break;
        default:
          console.log(formatted);
      }
    }
    
    // Log to file
    await this.writeToFile(formatted);
  }

  async debug(message, data = null) {
    await this.log('debug', message, data);
  }

  async info(message, data = null) {
    await this.log('info', message, data);
  }

  async warn(message, data = null) {
    await this.log('warn', message, data);
  }

  async error(message, data = null) {
    await this.log('error', message, data);
  }

  // Specific logging methods for your app
  async logAction(action, profile, result = null) {
    const message = `Action executed: ${action.getFullActionName()} for profile: ${profile.userName}`;
    await this.info(message, {
      action: action.toJSON(),
      profile: profile.userName,
      result: result
    });
  }

  async logTaskStart(task, profile) {
    const message = `Task started: ${task.getFullActionName()} for profile: ${profile.userName}`;
    await this.info(message, {
      task: task.toJSON(),
      profile: profile.userName
    });
  }

  async logTaskComplete(task, profile, result) {
    const message = `Task completed: ${task.getFullActionName()} for profile: ${profile.userName}`;
    await this.info(message, {
      task: task.toJSON(),
      profile: profile.userName,
      result: result,
      duration: task.getDuration()
    });
  }

  async logTaskError(task, profile, error) {
    const message = `Task failed: ${task.getFullActionName()} for profile: ${profile.userName}`;
    await this.error(message, {
      task: task.toJSON(),
      profile: profile.userName,
      error: error.message,
      stack: error.stack
    });
  }

  async logFollowAction(followerProfile, targetUserName, result) {
    const message = `Follow action: ${followerProfile.userName} -> ${targetUserName}`;
    await this.info(message, {
      follower: followerProfile.userName,
      target: targetUserName,
      result: result
    });
  }

  async logLikeAction(profile, targetUserName, postIndex, result) {
    const message = `Like action: ${profile.userName} liked post ${postIndex} of ${targetUserName}`;
    await this.info(message, {
      profile: profile.userName,
      target: targetUserName,
      postIndex: postIndex,
      result: result
    });
  }

  async logState(state) {
    const message = 'Application state logged';
    await this.debug(message, state);
  }

  // Method to get log file path for current date
  getCurrentLogFile() {
    return this.currentLogFile;
  }

  // Method to clean up old log files
  async cleanOldLogs(daysToKeep = 30) {
    if (!this.logToFile) return;
    
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            console.log(`Removed old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }
}

module.exports = Logger;
