require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TaskController = require('./controllers/TaskController');
const Logger = require('./utils/Logger');

async function main() {
  const logger = new Logger();
  
  try {
    await logger.info('=== Instagram Automation Started (New Architecture) ===');
    
    // Create task controller
    const taskController = new TaskController();
    
    // Get current status
    const initialStats = await taskController.getProfileStats();
    await logger.info('Initial profile stats:', initialStats);
    
    // Run automation tasks
    const result = await taskController.runAutomationTask();
    
    await logger.info('Automation completed:', result);
    
    // Get final stats
    const finalStats = await taskController.getProfileStats();
    await logger.info('Final profile stats:', finalStats);
    
  } catch (error) {
    await logger.error('Application failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Run the application
main().catch(console.error);
