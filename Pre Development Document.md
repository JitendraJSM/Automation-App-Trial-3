Tech Stack

- Node js
- Puppeteer

# Algorithm / flow

## Step 1.

    - index.js instanciate App
    - index.js instanciate db on App
    - index.js instanciate logger on App
    - index.js instanciate TaskController
    - index.js instanciate MediaController
    - index.js instanciate BrowserController

## Step 2.

    - App.db.profilesQueue = App.db.getProfilesQueue() -> returns array of profiles

## Step 3.

    - startAutomation(App)

### Step 3.1

        - while(App.db.profilesQueue.length > 0)
            - App.currentProfile = App.db.profilesQueue.shift()
            - App.logger.log("Starting automation for profile: " + App.currentProfile.name)
            - App.browser = BrowserController.launchBrowser(App.currentProfile)
            - App.page = App.browser.newPage()
            - TaskController.runTasks(App)
            - BrowserController.closeBrowser(App.browser)
            - App.logger.log("Finished automation for profile: " + App.currentProfile.name)
            - App.currentProfile = null
            - App.browser = null
            - App.page = null

## Step 4.

    - App.logger.log("All profiles processed. Now starting Media Editing and other tasks.")
    // Remaining tasks like media editing and other tasks can be done here after all profiles are processed.

#### Variables available on App

- db: instance of Database System
- logger: instance of Logging System
- profilesQueue: array of profiles to be processed
- currentProfile: currently processed profile
- browser: instance of BrowserController
- page: instance of Puppeteer Page

## TaskController.runTasks(App)

    - tasksQueue / tasksList / tasksArray = App.currentProfile.dueTasks

# Notable Points:

Design Patterns that i think best for this project
A detailed summary is as given below which pattern to use when for what:

1. logging system (named as Logger) that handles all info logs, warning logs, and other logs like all error logs consistently across the application.
2. Same for Database system that handles all type of database operations like creation, reading, writing, updation and deletion etc.
3. Only db (instance of Database System) and logger (instance of Logging System) can read and write files. (exception is media editing by python scripts.)
4.
