const BaseRepository = require("./BaseRepository.js");
const config = require("../../config/environment.js");
const { Profile } = require("../models");
const fs = require("fs-extra");
const path = require("path");

class ProfileRepository extends BaseRepository {
  constructor() {
    super(config.profilesDataPath);
  }

  // Convert raw data to Profile objects
  async getAllProfiles() {
    const rawData = await this.getAll();
    return rawData.map((data) => new Profile(data));
  }

  async getProfileByUserName(userName) {
    const profileData = await this.findOne({ userName });
    return profileData ? new Profile(profileData) : null;
  }

  async getProfilesByType(type) {
    const profilesData = await this.findBy({ type });
    return profilesData.map((data) => new Profile(data));
  }

  async getProfilesWithPendingTasks() {
    const allProfiles = await this.getAllProfiles();
    return allProfiles.filter((profile) => profile.hasPendingTasks());
  }

  async saveProfile(profile) {
    if (!(profile instanceof Profile)) {
      throw new Error("Expected Profile instance");
    }

    const existingProfile = await this.getProfileByUserName(profile.userName);

    if (existingProfile) {
      // Update existing profile
      await this.update(profile.userName, profile.toJSON(), "userName");
    } else {
      // Create new profile
      await this.create(profile.toJSON());
    }

    // Also save individual profile data file
    await this.saveIndividualProfileData(profile);

    return profile;
  }

  async saveAllProfiles(profiles) {
    const profilesData = profiles.map((profile) => {
      if (profile instanceof Profile) {
        return profile.toJSON();
      }
      return profile;
    });

    await this.save(profilesData);
    return true;
  }

  async deleteProfile(userName) {
    const profile = await this.getProfileByUserName(userName);
    if (!profile) {
      throw new Error(`Profile with userName: ${userName} not found`);
    }

    // Delete from main profiles file
    await this.delete(userName, "userName");

    // Delete individual profile data file
    if (profile.userDataPath && (await fs.pathExists(profile.userDataPath))) {
      await fs.remove(profile.userDataPath);
    }

    return true;
  }

  // Individual profile data file management
  async saveIndividualProfileData(profile) {
    if (!profile.userDataPath) {
      throw new Error("Profile must have a userDataPath defined");
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(profile.userDataPath);
      await fs.ensureDir(dir);

      // Read existing data to preserve additional fields
      let existingData = {};
      if (await fs.pathExists(profile.userDataPath)) {
        existingData = JSON.parse(
          await fs.readFile(profile.userDataPath, "utf8")
        );
      }

      // Merge with new data, preserving timestamps
      const dataToSave = {
        ...existingData,
        ...profile.toJSON(),
        lastDataOverwriteDate: new Date().toISOString(),
      };

      await fs.writeFile(
        profile.userDataPath,
        JSON.stringify(dataToSave, null, 2)
      );
      return true;
    } catch (error) {
      console.error(
        `Error saving individual profile data for ${profile.userName}:`,
        error
      );
      throw error;
    }
  }

  async readIndividualProfileData(userName) {
    const profile = await this.getProfileByUserName(userName);
    if (!profile) {
      throw new Error(`Profile with userName: ${userName} not found`);
    }

    if (!profile.userDataPath) {
      throw new Error(`Profile ${userName} does not have userDataPath defined`);
    }

    if (!(await fs.pathExists(profile.userDataPath))) {
      throw new Error(
        `Individual profile data file does not exist: ${profile.userDataPath}`
      );
    }

    try {
      const data = JSON.parse(await fs.readFile(profile.userDataPath, "utf8"));
      return new Profile(data);
    } catch (error) {
      console.error(
        `Error reading individual profile data for ${userName}:`,
        error
      );
      throw error;
    }
  }

  // Task management methods
  async addTaskToProfile(userName, task) {
    const profile = await this.getProfileByUserName(userName);
    if (!profile) {
      throw new Error(`Profile with userName: ${userName} not found`);
    }

    profile.addTask(task);
    await this.saveProfile(profile);
    return true;
  }

  async removeTaskFromProfile(userName, taskToRemove) {
    const profile = await this.getProfileByUserName(userName);
    if (!profile) {
      throw new Error(`Profile with userName: ${userName} not found`);
    }

    profile.removeTask(taskToRemove);
    await this.saveProfile(profile);
    return true;
  }

  // Follow tracking methods
  async addFollowRecord(userName, followData) {
    const profile = await this.getProfileByUserName(userName);
    if (!profile) {
      throw new Error(`Profile with userName: ${userName} not found`);
    }

    profile.addFollow(followData);
    await this.saveProfile(profile);
    return true;
  }

  // Profile creation helper
  async createNewProfile(profileData) {
    const profile = new Profile(profileData);

    // Validate required fields
    if (!profile.userName) {
      throw new Error("Profile must have a userName");
    }

    if (await this.getProfileByUserName(profile.userName)) {
      throw new Error(
        `Profile with userName: ${profile.userName} already exists`
      );
    }

    // Set default userDataPath if not provided
    if (!profile.userDataPath) {
      profile.userDataPath = `./data/instaProfilesData/${profile.type}sData/${profile.userName}-data.json`;
    }

    await this.saveProfile(profile);
    return profile;
  }

  // Profile stats and analytics
  async getProfileStats() {
    const profiles = await this.getAllProfiles();

    const stats = {
      total: profiles.length,
      agents: profiles.filter((p) => p.isAgent()).length,
      scrapers: profiles.filter((p) => p.isScraper()).length,
      resources: profiles.filter((p) => p.isResource()).length,
      withPendingTasks: profiles.filter((p) => p.hasPendingTasks()).length,
      needingUpdate: profiles.filter((p) => p.needsUpdate()).length,
    };

    return stats;
  }

  // Backup and restore
  async createBackup() {
    const backupPath = await this.backupFile();
    console.log(`Profile data backed up to: ${backupPath}`);
    return backupPath;
  }

  // Get profiles that need updates
  async getProfilesNeedingUpdate(maxAgeHours = 24) {
    const profiles = await this.getAllProfiles();
    return profiles.filter((profile) => profile.needsUpdate(maxAgeHours));
  }
}

module.exports = ProfileRepository;
