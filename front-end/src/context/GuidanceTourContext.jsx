import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  isGuidanceTourCompleted,
  setGuidanceTourCompleted,
} from "../utils/guidanceTourStorage";
import GuidanceTourDialog from "../components/GuidanceTourDialog";

const GuidanceTourContext = createContext(null);

export function GuidanceTourProvider({ children }) {
  const [completed, setCompleted] = useState(() => isGuidanceTourCompleted());
  const [tourOpen, setTourOpen] = useState(false);

  const showTourButtons = !completed;

  const startTour = useCallback(() => {
    setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
  }, []);

  const completeTour = useCallback(() => {
    setGuidanceTourCompleted(true);
    setCompleted(true);
    setTourOpen(false);
  }, []);

  const resetTourCompletion = useCallback(() => {
    setGuidanceTourCompleted(false);
    setCompleted(false);
  }, []);

  const value = useMemo(
    () => ({
      completed,
      showTourButtons,
      tourOpen,
      startTour,
      closeTour,
      completeTour,
      resetTourCompletion,
    }),
    [completed, showTourButtons, tourOpen, startTour, closeTour, completeTour, resetTourCompletion]
  );

  return (
    <GuidanceTourContext.Provider value={value}>
      {children}
      <GuidanceTourDialog open={tourOpen} onClose={closeTour} onFinish={completeTour} />
    </GuidanceTourContext.Provider>
  );
}

export function useGuidanceTour() {
  const ctx = useContext(GuidanceTourContext);
  if (!ctx) {
    throw new Error("useGuidanceTour must be used within GuidanceTourProvider");
  }
  return ctx;
}

/** Safe for components that may render outside provider (optional). */
export function useGuidanceTourOptional() {
  return useContext(GuidanceTourContext);
}
