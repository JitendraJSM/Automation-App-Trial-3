const App = require("./App.js");
const Automator = require("./Automator.js");
const TaskController = require("./controllers/TaskController.js");

async function main() {
  try {
    // Initialize App module
    const app = new App();

    await app.getControllers();

    await app.logger.info("=== Instagram Automation Started (New Architecture) ===");

    // Run automation tasks
    const result = await taskController.runAutomationTask();

    await logger.info("Automation completed:", result);

    // Get final stats
    const finalStats = await taskController.getProfileStats();
    await logger.info("Final profile stats:", finalStats);
  } catch (error) {
    await logger.error("Application failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Graceful shutdown...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Graceful shutdown...");
  process.exit(0);
});

// Run the application
main().catch(console.error);
