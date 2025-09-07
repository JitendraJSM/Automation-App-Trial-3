const fs = require('fs-extra');
const path = require('path');

class BaseRepository {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFileExists();
  }

  async ensureFileExists() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      await fs.ensureDir(dir);
      
      // Create file if it doesn't exist
      if (!(await fs.pathExists(this.filePath))) {
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error(`Error ensuring file exists: ${this.filePath}`, error);
      throw error;
    }
  }

  async readFile() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file: ${this.filePath}`, error);
      throw error;
    }
  }

  async writeFile(data) {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing file: ${this.filePath}`, error);
      throw error;
    }
  }

  async backupFile() {
    try {
      const backupPath = `${this.filePath}.backup.${Date.now()}`;
      await fs.copy(this.filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error(`Error creating backup: ${this.filePath}`, error);
      throw error;
    }
  }

  // Generic CRUD operations for JSON files
  async getAll() {
    return await this.readFile();
  }

  async save(data) {
    return await this.writeFile(data);
  }

  async findById(id, idField = 'id') {
    const data = await this.readFile();
    return data.find(item => item[idField] === id);
  }

  async findBy(criteria) {
    const data = await this.readFile();
    return data.filter(item => {
      return Object.keys(criteria).every(key => item[key] === criteria[key]);
    });
  }

  async findOne(criteria) {
    const results = await this.findBy(criteria);
    return results.length > 0 ? results[0] : null;
  }

  async create(newItem) {
    const data = await this.readFile();
    data.push(newItem);
    await this.writeFile(data);
    return newItem;
  }

  async update(id, updates, idField = 'id') {
    const data = await this.readFile();
    const index = data.findIndex(item => item[idField] === id);
    
    if (index === -1) {
      throw new Error(`Item with ${idField}: ${id} not found`);
    }
    
    data[index] = { ...data[index], ...updates };
    await this.writeFile(data);
    return data[index];
  }

  async delete(id, idField = 'id') {
    const data = await this.readFile();
    const index = data.findIndex(item => item[idField] === id);
    
    if (index === -1) {
      throw new Error(`Item with ${idField}: ${id} not found`);
    }
    
    const deleted = data.splice(index, 1)[0];
    await this.writeFile(data);
    return deleted;
  }

  async exists(id, idField = 'id') {
    const item = await this.findById(id, idField);
    return item !== null && item !== undefined;
  }

  async count() {
    const data = await this.readFile();
    return data.length;
  }

  // Utility methods
  getFilePath() {
    return this.filePath;
  }

  async getFileStats() {
    try {
      const stats = await fs.stat(this.filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    } catch (error) {
      console.error(`Error getting file stats: ${this.filePath}`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
