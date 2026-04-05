const STORAGE_KEY = "timesheet_guidance_tour_completed_v1";

export function isGuidanceTourCompleted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGuidanceTourCompleted(completed) {
  try {
    if (completed) {
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
