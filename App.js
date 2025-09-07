const config = require("./config/environment.js");
const Logger = require("./modules/Logger.js");
const Database = require("./modules/databaseModules/DataBaseModule.js");

// Note: Use Builder Pattern for App
class App {
  constructor() {
    this.config = {};
    this.db = new Database();
    this.logger = new Logger();
  }

  getControllers() {
    // Dynamically import controllers to avoid circular dependencies
    const TaskController = require("./controllers/TaskController.js");
    const BrowserController = require("./controllers/BrowserController.js");
    const ProfileController = require("./controllers/ProfileController.js");

    this.taskController = new TaskController(this);
    this.browserController = new BrowserController(this);
    this.profileController = new ProfileController(this);
  }

  setVersion(version) {
    this.version = version;
    return this;
  }

  setConfig(config) {
    this.config = config;
    return this;
  }

  build() {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
    };
  }
}

export default App;
