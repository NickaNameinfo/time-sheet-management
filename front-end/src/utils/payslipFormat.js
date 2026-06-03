/** Indian-style amount formatting: 45,000.00 */
export function formatPayslipAmount(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n === 0) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPayslipAmountOrDash(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n === 0) return "-";
  return formatPayslipAmount(n);
}

export function parsePayslipAmount(str) {
  if (str === "" || str === "-" || str == null) return 0;
  const n = parseFloat(String(str).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${ones[n % 10] ? ` ${ones[n % 10]}` : ""}`.trim();
}

function sectionToWords(n) {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${ones[h]} Hundred${r ? ` ${twoDigits(r)}` : ""}`.trim();
  }
  return "";
}

/** Rupees in words (Indian numbering: lakh, crore). */
export function amountInWordsRupees(amount) {
  const n = Math.round(parseFloat(amount) || 0);
  if (n === 0) return "Zero only";
  let num = n;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  const parts = [];
  if (crore) parts.push(`${sectionToWords(crore)} Crore`);
  if (lakh) parts.push(`${sectionToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${sectionToWords(thousand)} Thousand`);
  if (hundred) parts.push(`${ones[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  const words = parts.join(" ").replace(/\s+/g, " ").trim();
  const titled = words.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${titled} only`;
}

/** Split a gross amount into payslip earning rows (Basic, HRA, allowances). */
function splitGrossIntoEarningRows(gross) {
  const g = Math.round(parseFloat(gross) || 0);
  if (g <= 0) {
    return {
      basic: 0,
      hra: 0,
      conveyanceAllowance: 0,
      foodAllowance: 0,
      medicalExpenses: 0,
      mobileAllowance: 0,
      specialAllowance: 0,
      grossSalary: 0,
    };
  }
  const basic = Math.round(g * 0.5);
  const hra = Math.round(g * 0.25);
  const conveyance = Math.min(1600, g);
  const food = Math.min(2000, Math.max(0, g - basic - hra - conveyance));
  const medical = Math.min(1250, Math.max(0, g - basic - hra - conveyance - food));
  const mobile = Math.min(1000, Math.max(0, g - basic - hra - conveyance - food - medical));
  const special = Math.max(0, g - basic - hra - conveyance - food - medical - mobile);
  return {
    basic,
    hra,
    conveyanceAllowance: conveyance,
    foodAllowance: food,
    medicalExpenses: medical,
    mobileAllowance: mobile,
    specialAllowance: special,
    grossSalary: g,
  };
}

/**
 * Profile monthly salary — reference only on slip (not used for gross earnings).
 */
export function buildEarningsFromEmployeeSalary(monthlySalary) {
  return splitGrossIntoEarningRows(monthlySalary);
}

/**
 * Payslip earnings from this month payable (regular logged hours pay only).
 */
export function buildEarningsFromMonthPayable(monthPayable) {
  return splitGrossIntoEarningRows(monthPayable);
}

export function buildPayslipFromAttendance({
  totalSalary = 0,
  regularPay = 0,
  weekendPay = 0,
  extraPay = 0,
  holidayPay = 0,
  monthPayable: explicitMonthPayable,
}) {
  const profile = Math.round(parseFloat(totalSalary) || 0);
  const regular = Number(parseFloat(regularPay).toFixed(2));
  const weekend = Number(parseFloat(weekendPay).toFixed(2));
  const extra = Number(parseFloat(extraPay).toFixed(2));
  const holiday = Number(parseFloat(holidayPay).toFixed(2));
  const explicit = parseFloat(explicitMonthPayable);
  const fromHours = Number((regular + holiday).toFixed(2));
  const monthPayable =
    !Number.isNaN(explicit) && explicit > 0
      ? Number(explicit.toFixed(2))
      : fromHours;

  const earnings = buildEarningsFromMonthPayable(monthPayable);
  const deductions = buildDeductionsForMonthPayable(monthPayable, profile);

  return {
    totalSalary: profile,
    regularPay: regular,
    weekendPay: weekend,
    extraPay: extra,
    holidayPay: holiday,
    monthPayable,
    earnings,
    deductions,
    inHandSalary: Math.max(0, monthPayable - sumDeductions(deductions)),
  };
}

/** @deprecated Use buildEarningsFromMonthPayable */
export const buildDefaultEarnings = buildEarningsFromEmployeeSalary;

/** No automatic deductions — in-hand equals month payable unless entered manually. */
export function emptyDeductions() {
  return {
    advance: 0,
    mediclaim: 0,
    tds: 0,
    pfEmployee: 0,
    otherDeduction: 0,
    professionalTax: 0,
    totalDeduction: 0,
  };
}

export function buildDeductionsForMonthPayable() {
  return emptyDeductions();
}

export function buildDefaultDeductions() {
  return emptyDeductions();
}

/** Normalize saved payslip_detail.earnings (numbers or formatted strings). */
export function normalizePayslipEarnings(raw) {
  if (!raw || typeof raw !== "object") return null;
  const normalized = {
    basic: parsePayslipAmount(raw.basic),
    hra: parsePayslipAmount(raw.hra),
    conveyanceAllowance: parsePayslipAmount(raw.conveyanceAllowance),
    foodAllowance: parsePayslipAmount(raw.foodAllowance),
    medicalExpenses: parsePayslipAmount(raw.medicalExpenses),
    mobileAllowance: parsePayslipAmount(raw.mobileAllowance),
    specialAllowance: parsePayslipAmount(raw.specialAllowance),
    grossSalary: parsePayslipAmount(raw.grossSalary),
  };
  return sumEarnings(normalized) > 0 ? normalized : null;
}

/**
 * Month payable = regular pay + govt holiday pay (matches admin Salary & Payslip grid).
 * Does not use stale saved earnings / profile salary as payable.
 */
export function resolveMonthPayableFromAttendance(data = {}, row = {}) {
  const reg = parseFloat(data.regularPay ?? row.regularPay);
  const hol = parseFloat(data.holidayPay ?? row.holidayPay);
  if (!Number.isNaN(reg) && !Number.isNaN(hol)) {
    const fromParts = Number((reg + hol).toFixed(2));
    if (fromParts > 0) return fromParts;
  }
  const breakdown = data.attendancePayBreakdown;
  if (breakdown) {
    const fromBd = Number(
      (parseFloat(breakdown.regularPay) + parseFloat(breakdown.holidayPay)).toFixed(2)
    );
    if (fromBd > 0) return fromBd;
  }
  const mp = parseFloat(data.monthPayable);
  if (!Number.isNaN(mp) && mp > 0) return mp;
  return getMonthPayableAmount(row);
}

/** @deprecated Use resolveMonthPayableFromAttendance */
export function resolveSavedMonthPayable(data = {}, detail = {}, row = {}) {
  return resolveMonthPayableFromAttendance(data, row);
}

export function sumEarnings(earnings) {
  if (!earnings) return 0;
  return (
    parsePayslipAmount(earnings.basic) +
    parsePayslipAmount(earnings.hra) +
    parsePayslipAmount(earnings.conveyanceAllowance) +
    parsePayslipAmount(earnings.foodAllowance) +
    parsePayslipAmount(earnings.medicalExpenses) +
    parsePayslipAmount(earnings.mobileAllowance) +
    parsePayslipAmount(earnings.specialAllowance)
  );
}

export function sumDeductions(deductions) {
  return (
    parsePayslipAmount(deductions.advance) +
    parsePayslipAmount(deductions.mediclaim) +
    parsePayslipAmount(deductions.tds) +
    parsePayslipAmount(deductions.otherDeduction) +
    parsePayslipAmount(deductions.professionalTax)
  );
}

export function formatPayPeriod(startDate, endDate) {
  const fmt = (d) => {
    if (!d) return "";
    const [y, m, day] = String(d).slice(0, 10).split("-");
    return `${day}-${m}-${y}`;
  };
  return `${fmt(startDate)} to ${fmt(endDate)}`;
}

export function formatDoj(dateVal) {
  if (!dateVal) return "";
  const raw = String(dateVal).trim();
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw;
  const d = new Date(dateVal);
  if (!Number.isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}.${m}.${d.getFullYear()}`;
  }
  const s = raw.slice(0, 10);
  const [y, m, day] = s.split("-");
  if (y && m && day) return `${day}.${m}.${y}`;
  return raw;
}

/** DOJ text for editor field */
export function dojToEditorText(dateVal) {
  return formatDoj(dateVal);
}

export const DEFAULT_COMPANY = {
  name: "CONVERGEPOINT India Private Limited",
  address: "Old No. 853 New No.250 Poonamallee High Road, Kilpauk, Chennai 600010",
  phone: "044-25320147",
};

export function getHolidayPay(row) {
  return parseFloat(row?.holidayPay) || 0;
}

/** Final payable: regular pay + government holiday pay. */
export function getMonthPayableAmount(row) {
  if (row?.monthPayable != null && !Number.isNaN(Number(row.monthPayable))) {
    return Number(row.monthPayable);
  }
  return Number(
    (parseFloat(row?.regularPay || 0) + parseFloat(row?.holidayPay || 0)).toFixed(2)
  );
}

export function getTotalSalary(row) {
  return parseFloat(row?.totalSalary ?? row?.baseSalary) || 0;
}

/** Weekday regular hours logged (≤8h/day); used vs required period hours. */
export function getLoggedHours(row) {
  if (row?.loggedHours != null && !Number.isNaN(Number(row.loggedHours))) {
    return Number(row.loggedHours);
  }
  return parseFloat(row?.regularHours) || 0;
}

export function getRequiredHours(row) {
  return parseFloat(row?.requiredHours ?? row?.expectedHours) || 0;
}

/** Regular hours not logged vs required period hours (weekdays × 8h). */
export function getMissingHours(row) {
  if (row?.missingHours != null && !Number.isNaN(Number(row.missingHours))) {
    return Number(row.missingHours);
  }
  const required = getRequiredHours(row);
  const logged = getLoggedHours(row);
  return Number(Math.max(0, required - logged).toFixed(2));
}

export const DEFAULT_PAYMENT = {
  chqNumber: "Account Transfer",
  chqDate: "",
  bankName: "HDFC BANK LTD",
};
