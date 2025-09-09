const ProfileRepository = require("../repositories/ProfileRepository");
const InstagramService = require("../services/InstagramService");
const MediaDownloadService = require("../services/MediaDownloadService");
const MediaEditingService = require("../services/MediaEditingService");
const ScrapingService = require("../services/ScrapingService");
const Logger = require("../modules/Logger");
const { Task } = require("../models");
const config = require("../config/environment");

class TaskController {
  constructor() {
    this.profileRepository = new ProfileRepository();
    this.logger = new Logger();
    this.instagramService = null;
    this.mediaDownloadService = null;
    this.mediaEditingService = null;
    this.scrapingService = null;
    this.currentProfile = null;
    this.isRunning = false;
  }

  // =============== MAIN EXECUTION METHODS ===============
  // async runAutomationTask(taskConfig = null) {
  //   try {
  //     this.isRunning = true;
  //     await this.logger.info("Starting automation task execution");

  //     // Load all profiles
  //     const profiles = await this.profileRepository.getProfilesWithPendingTasks();

  //     if (profiles.length === 0) {
  //       await this.logger.info("No profiles with pending tasks found");
  //       return { success: true, message: "No pending tasks" };
  //     }

  //     await this.logger.info(`Found ${profiles.length} profiles with pending tasks`);

  //     const results = [];

  //     // Process each profile
  //     for (const profile of profiles) {
  //       try {
  //         await this.logger.info(`Processing profile: ${profile.userName}`);

  //         const profileResult = await this.processProfileTasks(profile);
  //         results.push({
  //           profile: profile.userName,
  //           result: profileResult,
  //         });

  //         // Optional: Change IP address between profiles (for your airplane mode feature)
  //         if (profiles.indexOf(profile) < profiles.length - 1) {
  //           await this.changeIPAddress();
  //         }
  //       } catch (error) {
  //         await this.logger.error(`Failed to process profile: ${profile.userName}`, error);
  //         results.push({
  //           profile: profile.userName,
  //           error: error.message,
  //         });
  //       }
  //     }

  //     await this.logger.info("Automation task execution completed");
  //     return { success: true, results };
  //   } catch (error) {
  //     await this.logger.error("Automation task execution failed", error);
  //     throw error;
  //   } finally {
  //     this.isRunning = false;
  //     if (this.instagramService) {
  //       await this.instagramService.cleanup();
  //     }
  //   }
  // }
  async runAutomationTask(app, task) {
    try {
      app.logger.info(
        "Starting automation task execution in app.taskController.runAutomationTask() function in TaskController.js"
      );
    } catch (error) {
      app.logger.error("Automation task execution failed", error);
      throw error;
    }
  }
  async processProfileTasks(profile) {
    try {
      // Initialize services for this profile
      this.instagramService = new InstagramService(
        this.profileRepository,
        this.logger
      );
      await this.instagramService.initialize(profile);

      this.scrapingService = new ScrapingService(
        this.profileRepository,
        this.logger
      );
      await this.scrapingService.initialize(profile);

      this.mediaDownloadService = new MediaDownloadService(
        this.profileRepository,
        this.scrapingService,
        this.logger
      );
      this.mediaEditingService = new MediaEditingService(
        this.profileRepository,
        this.logger
      );

      this.currentProfile = profile;

      const taskResults = [];

      // Process each task for this profile
      for (const taskData of profile.dueTasks) {
        try {
          const task = Task.fromLegacyFormat(taskData);

          await this.logger.logTaskStart(task, profile);

          const result = await this.executeTask(task);

          task.markAsCompleted(result);
          await this.logger.logTaskComplete(task, profile, result);

          // Remove completed task from profile
          profile.removeTask(taskData);

          taskResults.push({
            task: task.getFullActionName(),
            success: true,
            result: result,
          });
        } catch (error) {
          const task = Task.fromLegacyFormat(taskData);
          task.markAsFailed(error.message);

          await this.logger.logTaskError(task, profile, error);

          taskResults.push({
            task: task.getFullActionName(),
            success: false,
            error: error.message,
          });
        }
      }

      // Save updated profile (with completed tasks removed)
      await this.profileRepository.saveProfile(profile);

      return {
        success: true,
        tasksProcessed: taskResults.length,
        results: taskResults,
      };
    } catch (error) {
      await this.logger.error(
        `Failed to process tasks for profile: ${profile.userName}`,
        error
      );
      throw error;
    } finally {
      if (this.instagramService) {
        await this.instagramService.cleanup();
        this.instagramService = null;
      }
      if (this.scrapingService) {
        await this.scrapingService.cleanup();
        this.scrapingService = null;
      }
      this.mediaDownloadService = null;
      this.mediaEditingService = null;
    }
  }

  // =============== TASK EXECUTION ===============
  async executeTask(task) {
    const { parentModuleName, actionName, argumentsString } = task;

    await this.logger.info(`Executing task: ${task.getFullActionName()}`);

    // Parse arguments
    const args = this.parseArguments(argumentsString);

    // Route to appropriate service method
    switch (parentModuleName) {
      case "instaAuto":
        return await this.executeInstagramTask(actionName, args);

      case "db":
        return await this.executeDatabaseTask(actionName, args);

      case "instaScraper":
        return await this.executeScrapingTask(actionName, args);

      case "mediaDownload":
        return await this.executeMediaDownloadTask(actionName, args);

      case "mediaEditing":
        return await this.executeMediaEditingTask(actionName, args);

      default:
        throw new Error(`Unknown module: ${parentModuleName}`);
    }
  }

  async executeInstagramTask(actionName, args) {
    if (!this.instagramService) {
      throw new Error("Instagram service not initialized");
    }

    switch (actionName) {
      case "follow":
        const targetUserName = args[0];
        return await this.instagramService.followUser(targetUserName);

      case "like":
        const userToLike = args[0];
        const likeOptions = args[1] || {};
        return await this.instagramService.likeUserPosts(
          userToLike,
          likeOptions
        );

      case "updateUserData":
        const forceUpdate = args[0] === true || args[0] === "true";
        return await this.instagramService.updateProfileData(forceUpdate);

      default:
        throw new Error(`Unknown Instagram action: ${actionName}`);
    }
  }

  async executeDatabaseTask(actionName, args) {
    switch (actionName) {
      case "readProfilesData":
        const profiles = await this.profileRepository.getAllProfiles();
        return profiles.map((p) => p.toJSON());

      case "getProfileStats":
        return await this.profileRepository.getProfileStats();

      default:
        throw new Error(`Unknown database action: ${actionName}`);
    }
  }

  async executeScrapingTask(actionName, args) {
    if (!this.scrapingService) {
      throw new Error("Scraping service not initialized");
    }

    switch (actionName) {
      case "scrapeProfile":
      case "targetScraper":
        const targetUserName = args[0];
        const options = args[1] || {};
        return await this.scrapingService.scrapeUserProfile(
          targetUserName,
          options
        );

      case "scrapeMetadata":
        const userName = args[0];
        return await this.scrapingService.scrapeProfileMetadata(userName);

      case "addScrapingTarget":
        const target = args[0];
        const targetType = args[1] || "profile";
        return await this.scrapingService.addScrapingTarget(target, targetType);

      default:
        throw new Error(`Unknown scraping action: ${actionName}`);
    }
  }

  async executeMediaDownloadTask(actionName, args) {
    if (!this.mediaDownloadService) {
      throw new Error("Media download service not initialized");
    }

    switch (actionName) {
      case "downloadUserMedia":
        const userName = args[0];
        const options = args[1] || {};
        return await this.mediaDownloadService.downloadUserMedia(
          userName,
          options
        );

      case "downloadBatch":
        const userNames = args[0];
        const batchOptions = args[1] || {};
        return await this.mediaDownloadService.downloadMultipleUsers(
          userNames,
          batchOptions
        );

      default:
        throw new Error(`Unknown media download action: ${actionName}`);
    }
  }

  async executeMediaEditingTask(actionName, args) {
    if (!this.mediaEditingService) {
      throw new Error("Media editing service not initialized");
    }

    switch (actionName) {
      case "processUserMedia":
        const userName = args[0];
        const options = args[1] || {};
        return await this.mediaEditingService.processUserMedia(
          userName,
          options
        );

      case "processBatch":
        const userNames = args[0];
        const batchOptions = args[1] || {};
        return await this.mediaEditingService.processBatchMedia(
          userNames,
          batchOptions
        );

      case "processImages":
        const inputPath = args[0];
        const outputPath = args[1];
        const imageOptions = args[2] || {};
        return await this.mediaEditingService.processImages(
          inputPath,
          outputPath,
          imageOptions
        );

      case "processVideos":
        const videoInputPath = args[0];
        const videoOutputPath = args[1];
        const videoOptions = args[2] || {};
        return await this.mediaEditingService.processVideos(
          videoInputPath,
          videoOutputPath,
          videoOptions
        );

      default:
        throw new Error(`Unknown media editing action: ${actionName}`);
    }
  }

  // =============== UTILITY METHODS ===============
  parseArguments(argumentsString) {
    if (!argumentsString) return [];

    // Handle different argument formats
    if (typeof argumentsString === "string") {
      // Split by comma and trim whitespace
      return argumentsString.split(",").map((arg) => {
        const trimmed = arg.trim();

        // Convert boolean strings
        if (trimmed === "true") return true;
        if (trimmed === "false") return false;

        // Convert numbers
        if (!isNaN(trimmed) && trimmed !== "") return Number(trimmed);

        return trimmed;
      });
    }

    return [argumentsString];
  }

  async changeIPAddress() {
    // Placeholder for your airplane mode IP changing functionality
    await this.logger.info(
      "IP address change requested (not implemented in new architecture yet)"
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
  }

  // =============== TASK MANAGEMENT ===============
  async addTaskToProfile(userName, taskData) {
    try {
      const task = new Task(taskData);
      await this.profileRepository.addTaskToProfile(userName, task.toJSON());
      await this.logger.info(
        `Task added to profile ${userName}: ${task.getFullActionName()}`
      );
      return { success: true };
    } catch (error) {
      await this.logger.error(
        `Failed to add task to profile ${userName}`,
        error
      );
      throw error;
    }
  }

  async removeTaskFromProfile(userName, taskData) {
    try {
      await this.profileRepository.removeTaskFromProfile(userName, taskData);
      await this.logger.info(`Task removed from profile ${userName}`);
      return { success: true };
    } catch (error) {
      await this.logger.error(
        `Failed to remove task from profile ${userName}`,
        error
      );
      throw error;
    }
  }

  // =============== PROFILE MANAGEMENT ===============
  async createNewProfile(profileData) {
    try {
      const profile = await this.profileRepository.createNewProfile(
        profileData
      );
      await this.logger.info(`New profile created: ${profile.userName}`);
      return profile;
    } catch (error) {
      await this.logger.error("Failed to create new profile", error);
      throw error;
    }
  }

  async getProfileStats() {
    try {
      return await this.profileRepository.getProfileStats();
    } catch (error) {
      await this.logger.error("Failed to get profile stats", error);
      throw error;
    }
  }

  // =============== STATUS METHODS ===============
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentProfile: this.currentProfile?.userName || null,
      hasInstagramService: this.instagramService !== null,
    };
  }

  async stop() {
    this.isRunning = false;
    if (this.instagramService) {
      await this.instagramService.cleanup();
    }
    await this.logger.info("Task controller stopped");
  }
}

module.exports = TaskController;
