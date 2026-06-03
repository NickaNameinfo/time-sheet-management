/**
 * Government / public holidays for payroll.
 * Merges: date-holidays library + supplemental JSON + optional app_settings overrides.
 */

import Holidays from "date-holidays";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STANDARD_DAILY_HOURS = 8;

const COUNTRY_TO_CODE = {
  India: "IN",
  IN: "IN",
  UAE: "AE",
  AE: "AE",
  "United Arab Emirates": "AE",
};

let supplementCache = null;

function loadSupplementData() {
  if (supplementCache) return supplementCache;
  try {
    const raw = fs.readFileSync(
      path.join(__dirname, "../data/publicHolidaysSupplement.json"),
      "utf8"
    );
    supplementCache = JSON.parse(raw);
  } catch {
    supplementCache = {};
  }
  return supplementCache;
}

function parseYmd(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return { y, m, d };
}

function eachDateInRange(startDate, endDate) {
  const { y: sy, m: sm, d: sd } = parseYmd(startDate);
  const { y: ey, m: em, d: ed } = parseYmd(endDate);
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const days = [];
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function yearsInRange(startDate, endDate) {
  const sy = parseInt(String(startDate).slice(0, 4), 10);
  const ey = parseInt(String(endDate).slice(0, 4), 10);
  const years = [];
  for (let y = sy; y <= ey; y += 1) years.push(String(y));
  return years;
}

function isWeekendDate(dateStr) {
  const { y, m, d } = parseYmd(dateStr);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}

export function resolveHolidayCountryCode(countryLabel) {
  const key = String(countryLabel || "India").trim();
  return COUNTRY_TO_CODE[key] || "IN";
}

function normalizeCustomHolidays(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((h) => ({
      date: String(h.date || "").slice(0, 10),
      name: String(h.name || h.title || "Public holiday").trim(),
    }))
    .filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.date) && h.name);
}

/** Build date → holiday map for a period (supplement file + custom overrides). */
function buildSupplementMap(countryLabel, startDate, endDate, customHolidays = []) {
  const code = resolveHolidayCountryCode(countryLabel);
  const data = loadSupplementData();
  const map = new Map();

  for (const year of yearsInRange(startDate, endDate)) {
    const yearList = data[code]?.[year] || [];
    for (const h of yearList) {
      if (h.date >= startDate && h.date <= endDate) {
        map.set(h.date, { name: h.name, type: "public" });
      }
    }
  }

  for (const h of normalizeCustomHolidays(customHolidays)) {
    if (h.date >= startDate && h.date <= endDate) {
      map.set(h.date, { name: h.name, type: "public" });
    }
  }

  return map;
}

function holidayFromLibrary(hd, dateStr) {
  const { y, m, d } = parseYmd(dateStr);
  const result = hd.isHoliday(new Date(y, m - 1, d, 12, 0, 0));
  if (!result) return null;
  const list = Array.isArray(result) ? result : [result];
  const pub = list.find((h) => h.type === "public") || list[0];
  if (!pub) return null;
  return {
    date: dateStr,
    name: pub.name || "Public holiday",
    type: pub.type || "public",
    source: "library",
  };
}

function holidayOnDate(hd, dateStr, supplementMap) {
  const sup = supplementMap.get(dateStr);
  const lib = holidayFromLibrary(hd, dateStr);

  if (sup && lib && lib.name !== sup.name) {
    return {
      date: dateStr,
      name: `${sup.name} / ${lib.name}`,
      type: "public",
      source: "merged",
    };
  }
  if (sup) {
    return { date: dateStr, name: sup.name, type: sup.type || "public", source: "supplemental" };
  }
  return lib;
}

function createHolidayContext(countryLabel, startDate, endDate, customHolidays = []) {
  const code = resolveHolidayCountryCode(countryLabel);
  return {
    hd: new Holidays(code),
    supplementMap: buildSupplementMap(countryLabel, startDate, endDate, customHolidays),
  };
}

/** All public holidays in range (includes weekends if the date is a public holiday). */
export function getPublicHolidaysInPeriod(
  startDate,
  endDate,
  countryLabel = "India",
  customHolidays = []
) {
  const { hd, supplementMap } = createHolidayContext(
    countryLabel,
    startDate,
    endDate,
    customHolidays
  );
  const holidays = [];
  for (const date of eachDateInRange(startDate, endDate)) {
    const h = holidayOnDate(hd, date, supplementMap);
    if (h) holidays.push({ ...h, isWeekend: isWeekendDate(date) });
  }
  return holidays;
}

/** Weekday public holidays only — used for holiday pay (8h each). */
export function getWeekdayPublicHolidaysInPeriod(
  startDate,
  endDate,
  countryLabel = "India",
  customHolidays = []
) {
  return getPublicHolidaysInPeriod(startDate, endDate, countryLabel, customHolidays).filter(
    (h) => !h.isWeekend
  );
}

export function enrichPeriodCalendarDays(
  baseCalendar,
  countryLabel = "India",
  customHolidays = []
) {
  if (!baseCalendar?.length) return baseCalendar || [];
  const startDate = baseCalendar[0].date;
  const endDate = baseCalendar[baseCalendar.length - 1].date;
  const { hd, supplementMap } = createHolidayContext(
    countryLabel,
    startDate,
    endDate,
    customHolidays
  );

  return baseCalendar.map((day) => {
    const h = holidayOnDate(hd, day.date, supplementMap);
    const isHoliday = Boolean(h);
    const isWeekend = day.isWeekend ?? isWeekendDate(day.date);
    return {
      ...day,
      isWeekend,
      isHoliday,
      holidayName: h?.name || null,
      isWorkingDay: !isWeekend && !isHoliday,
    };
  });
}

/** Working weekdays in period (excludes Sat/Sun and public holidays). */
export function computeExpectedPeriodHours(
  startDate,
  endDate,
  countryLabel = "India",
  customHolidays = []
) {
  const dates = eachDateInRange(startDate, endDate);
  const { hd, supplementMap } = createHolidayContext(
    countryLabel,
    startDate,
    endDate,
    customHolidays
  );
  let workingDays = 0;
  for (const date of dates) {
    if (isWeekendDate(date)) continue;
    if (holidayOnDate(hd, date, supplementMap)) continue;
    workingDays += 1;
  }
  return Number((workingDays * STANDARD_DAILY_HOURS).toFixed(2));
}

export function computeHolidayPayMetrics(
  monthlySalary,
  startDate,
  endDate,
  countryLabel = "India",
  expectedHours = null,
  customHolidays = []
) {
  const allHolidays = getPublicHolidaysInPeriod(
    startDate,
    endDate,
    countryLabel,
    customHolidays
  );
  const holidays = allHolidays.filter((h) => !h.isWeekend);
  const holidayHours = Number((holidays.length * STANDARD_DAILY_HOURS).toFixed(2));
  const expected =
    expectedHours != null
      ? Number(expectedHours)
      : computeExpectedPeriodHours(startDate, endDate, countryLabel, customHolidays);
  const salary = parseFloat(monthlySalary) || 0;
  const hourlyRate = expected > 0 && salary > 0 ? salary / expected : 0;
  const holidayPay = Number((holidayHours * hourlyRate).toFixed(2));

  return {
    holidays,
    allHolidays,
    holidayCount: holidays.length,
    holidayHours,
    holidayPay,
    hourlyRate: Number(hourlyRate.toFixed(4)),
    expectedHours: expected,
  };
}

async function readAppSetting(q, key) {
  try {
    const rows = await q(
      "SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1",
      [key]
    );
    if (!rows?.length || rows[0].setting_value == null) return null;
    let v = rows[0].setting_value;
    if (typeof v === "string") {
      const t = v.trim();
      if (t.startsWith("{") || t.startsWith("[")) {
        try {
          return JSON.parse(t);
        } catch {
          return v;
        }
      }
      return v.replace(/^"|"$/g, "");
    }
    return v;
  } catch {
    return null;
  }
}

export async function fetchPayrollCountryFromSettings(q) {
  const v = await readAppSetting(q, "country");
  if (v == null) return "India";
  if (typeof v === "object" && v?.country) return v.country;
  return String(v);
}

/** Optional JSON array: [{ "date": "2026-05-28", "name": "Bakrid" }] — overrides/supplements calendar. */
export async function fetchPayrollCustomHolidays(q) {
  const v = await readAppSetting(q, "payroll_custom_holidays");
  return normalizeCustomHolidays(Array.isArray(v) ? v : []);
}

export async function fetchPayrollHolidaySettings(q) {
  const [country, customHolidays] = await Promise.all([
    fetchPayrollCountryFromSettings(q),
    fetchPayrollCustomHolidays(q),
  ]);
  return { country, customHolidays };
}
