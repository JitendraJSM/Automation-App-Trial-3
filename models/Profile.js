class Profile {
  constructor(data = {}) {
    this.userName = data.userName || '';
    this.type = data.type || 'agent'; // 'agent', 'scraper', 'resource'
    this.profileTarget = data.profileTarget || '';
    this.password = data.password || '';
    this.userDataPath = data.userDataPath || '';
    
    // Metadata
    this.postsCount = data.postsCount || 0;
    this.followersCount = data.followersCount || 0;
    this.followingsCount = data.followingsCount || 0;
    this.mutualFollowersCount = data.mutualFollowersCount || 0;
    
    // Resource specific
    this.postsDownloaded = data.postsDownloaded || 0;
    this.postsEdited = data.postsEdited || 0;
    this.postsReadyToUpload = data.postsReadyToUpload || 0;
    
    // Agent specific
    this.linkedResourceUserName = data.linkedResourceUserName || '';
    this.automatedFollow = data.automatedFollow || [];
    
    // Tasks and tracking
    this.dueTasks = data.dueTasks || [];
    this.lastUpdate = data.lastUpdate || null;
    this.lastDataOverwriteDate = data.lastDataOverwriteDate || null;
  }

  // Helper methods
  isAgent() {
    return this.type === 'agent';
  }

  isScraper() {
    return this.type === 'scraper';
  }

  isResource() {
    return this.type === 'resource';
  }

  addFollow(followData) {
    this.automatedFollow.push({
      userName: followData.userName,
      date: followData.date || new Date().toISOString()
    });
  }

  addTask(task) {
    this.dueTasks.push(task);
  }

  removeTask(taskToRemove) {
    this.dueTasks = this.dueTasks.filter(task => 
      !(task.parentModuleName === taskToRemove.parentModuleName && 
        task.actionName === taskToRemove.actionName &&
        task.argumentsString === taskToRemove.argumentsString)
    );
  }

  hasPendingTasks() {
    return this.dueTasks.length > 0;
  }

  needsUpdate(maxAgeHours = 24) {
    if (!this.lastUpdate) return true;
    
    const timeDiff = new Date() - new Date(this.lastUpdate);
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    return hoursAgo > maxAgeHours;
  }

  updateMetadata(scrapedData) {
    this.postsCount = scrapedData.edge_owner_to_timeline_media?.count || this.postsCount;
    this.followersCount = scrapedData.edge_followed_by?.count || this.followersCount;
    this.followingsCount = scrapedData.edge_follow?.count || this.followingsCount;
    this.mutualFollowersCount = scrapedData.edge_mutual_followed_by?.count || this.mutualFollowersCount;
    this.lastUpdate = new Date().toISOString();
  }

  toJSON() {
    return {
      userName: this.userName,
      type: this.type,
      profileTarget: this.profileTarget,
      password: this.password,
      userDataPath: this.userDataPath,
      postsCount: this.postsCount,
      followersCount: this.followersCount,
      followingsCount: this.followingsCount,
      mutualFollowersCount: this.mutualFollowersCount,
      postsDownloaded: this.postsDownloaded,
      postsEdited: this.postsEdited,
      postsReadyToUpload: this.postsReadyToUpload,
      linkedResourceUserName: this.linkedResourceUserName,
      automatedFollow: this.automatedFollow,
      dueTasks: this.dueTasks,
      lastUpdate: this.lastUpdate,
      lastDataOverwriteDate: this.lastDataOverwriteDate
    };
  }
}

module.exports = Profile;
