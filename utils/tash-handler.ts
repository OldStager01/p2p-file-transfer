import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

TaskManager.defineTask(
  "BACKGROUND_FILE_TRANSFER",
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error("Background task failed:", error);
    }
    if (data) {
      console.log("Background task data:", data);
    }

    // Return a resolved Promise to satisfy the TaskManagerTaskExecutor type
    return Promise.resolve();
  }
);

export const registerBackgroundTask = async () => {
  await BackgroundFetch.registerTaskAsync("BACKGROUND_FILE_TRANSFER", {
    minimumInterval: 60, // Minimum interval for the background task
    stopOnTerminate: false, // Continue even if the app is terminated
  });
};
