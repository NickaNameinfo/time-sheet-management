import { useMemo } from "react";
import { apiService } from "../services/api";
import { useApi } from "./useApi";

function workMatchesPlanAssignment(w, a) {
  const wNo = w.projectNo != null ? String(w.projectNo).trim() : "";
  const aNo = a.projectNo != null ? String(a.projectNo).trim() : "";
  const wName = (w.projectName || "").trim().toLowerCase();
  const aName = (a.projectName || "").trim().toLowerCase();
  const wRef = w.referenceNo != null ? String(w.referenceNo).trim() : "";
  const aRef = a.referenceNo != null ? String(a.referenceNo).trim() : "";
  const projectMatch =
    (wNo && aNo && wNo === aNo) ||
    (wName && aName && wName === aName) ||
    (wRef && aRef && wRef === aRef);
  if (!projectMatch) return false;
  const sd = String(w.sentDate || "").slice(0, 10);
  const s0 = a.start_date ? String(a.start_date).slice(0, 10) : null;
  const e0 = a.end_date ? String(a.end_date).slice(0, 10) : null;
  if (!s0 || !e0) return true;
  return sd >= s0 && sd <= e0;
}

export function useEmployeePlanAssignments(employeeId) {
  const { data: assignedProjectsFromPlans, loading: assignedProjectsLoading } = useApi(
    () => {
      if (employeeId == null || employeeId === "") {
        return Promise.resolve({ data: { Status: "Success", Result: [] } });
      }
      return apiService.getEmployeeAssignedProjects({ employee_id: employeeId });
    },
    [employeeId],
    employeeId != null && employeeId !== ""
  );

  const assignedProjectsList = useMemo(() => {
    if (!assignedProjectsFromPlans) return [];
    if (Array.isArray(assignedProjectsFromPlans)) return assignedProjectsFromPlans;
    return assignedProjectsFromPlans?.Result || assignedProjectsFromPlans?.data?.Result || [];
  }, [assignedProjectsFromPlans]);

  const planWorkDateRange = useMemo(() => {
    if (!assignedProjectsList.length) return null;
    let min = null;
    let max = null;
    for (const a of assignedProjectsList) {
      const s = a.start_date ? String(a.start_date).slice(0, 10) : null;
      const e = a.end_date ? String(a.end_date).slice(0, 10) : null;
      if (s) min = !min || s < min ? s : min;
      if (e) max = !max || e > max ? e : max;
    }
    if (!min || !max) return null;
    return { startDate: min, endDate: max };
  }, [assignedProjectsList]);

  const { data: planWorkDetailsRaw, loading: planWorkDetailsLoading } = useApi(
    () => {
      if (employeeId == null || employeeId === "" || !planWorkDateRange) {
        return Promise.resolve({ data: { Status: "Success", Result: [] } });
      }
      return apiService.getWorkDetails({
        employeeId,
        startDate: planWorkDateRange.startDate,
        endDate: planWorkDateRange.endDate,
      });
    },
    [employeeId, planWorkDateRange?.startDate, planWorkDateRange?.endDate],
    Boolean(employeeId != null && employeeId !== "" && planWorkDateRange)
  );

  const planWorkDetailsRows = useMemo(() => {
    if (!planWorkDetailsRaw) return [];
    if (Array.isArray(planWorkDetailsRaw)) return planWorkDetailsRaw;
    return planWorkDetailsRaw?.Result || planWorkDetailsRaw?.data?.Result || [];
  }, [planWorkDetailsRaw]);

  const assignedPlansWithProgress = useMemo(() => {
    return assignedProjectsList.map((a) => {
      const rows = planWorkDetailsRows.filter((w) => workMatchesPlanAssignment(w, a));
      const usedHours = rows.reduce((sum, w) => sum + (parseFloat(w.totalHours) || 0), 0);
      const allotted = parseFloat(a.allotted_hours);
      const cap = Number.isFinite(allotted) && allotted > 0 ? allotted : parseFloat(a.plan_total_hours) || 0;
      const pct =
        cap > 0 ? Math.min(100, Math.round((usedHours / cap) * 1000) / 10) : 0;
      const hasPersonalCap = Number.isFinite(allotted) && allotted > 0;
      return {
        ...a,
        usedHours: Math.round(usedHours * 100) / 100,
        progressCap: cap,
        progressPercent: pct,
        progressLabel: hasPersonalCap
          ? "Your hours vs plan allotment"
          : "Your hours vs plan total (no per-person allotment)",
      };
    });
  }, [assignedProjectsList, planWorkDetailsRows]);

  return {
    assignedProjectsList,
    assignedProjectsLoading,
    planWorkDetailsLoading,
    assignedPlansWithProgress,
  };
}
