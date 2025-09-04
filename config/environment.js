require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const config = {
  // Environment
  environment: process.env.ENVIRONMENT || 'development',
  
  // Instagram limits
  maxDailyFollows: parseInt(process.env.MAX_DAILY_FOLLOWS) || 50,
  maxDailyLikes: parseInt(process.env.MAX_DAILY_LIKES) || 200,
  
  // Delays (in seconds)
  minDelay: parseFloat(process.env.MIN_DELAY) || 1,
  maxDelay: parseFloat(process.env.MAX_DELAY) || 3,
  
  // Resource checking
  minDaysToCheckResource: parseInt(process.env.MIN_DAYS_TO_CHECK_RESOURCE) || 7,
  
  // Browser settings
  chromeExecutablePath: process.env.CHROME_EXECUTABLE_PATH,
  headless: process.env.HEADLESS === 'false',
  // headless: process.env.HEADLESS === 'true',
  
  // Paths
  dataPath: './data',
  profilesDataPath: './data/allProfilesData.json',
  logsPath: './data/logs',
  
  // Bot settings
  botWorkShiftHours: 16,
};

module.exports = config;
