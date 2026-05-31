import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  History,
  Image as ImageIcon,
  MapPin,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";


const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = getTodayIso();

const GOOGLE_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxudXB_hFSKpiWBIz0xGWX9B_e3tfAG9_C55u8PPrMBEFKTYaNxqvWeX6b70xLNGLNLlw/exec";

const addressSuggestions = [
  "New Farm, QLD",
  "Teneriffe, QLD",
  "West End, QLD",
  "Paddington, QLD",
  "Brisbane City, QLD",
  "Fortitude Valley, QLD",
  "Kangaroo Point, QLD",
  "Bulimba, QLD",
  "Hawthorne, QLD",
  "Morningside, QLD",
];

function isoToDisplayDate(dateString) {
  if (!dateString || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateString)) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function displayToIsoDate(dateString) {
  if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(dateString)) return "";
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
}

function isValidDisplayDate(dateString) {
  if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(dateString)) return false;
  const [day, month, year] = dateString.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function runHelperTests() {
  console.assert(isoToDisplayDate("2026-05-15") === "15/05/2026", "ISO to display date conversion failed");
  console.assert(displayToIsoDate("15/05/2026") === "2026-05-15", "Display to ISO date conversion failed");
  console.assert(isValidDisplayDate("29/02/2024") === true, "Leap-year date should be valid");
  console.assert(isValidDisplayDate("31/02/2026") === false, "Invalid calendar date should be rejected");
}
runHelperTests();

const colourSchemes = {
  light: {
    name: "Clean White",
    appBg: "bg-slate-50",
    header: "from-slate-300 to-slate-200",
    activeTab: "bg-slate-900 text-white",
    inactiveTab: "border-slate-200 bg-white text-slate-800",
    accentText: "text-slate-700",
    strongText: "text-slate-900",
    mutedHeaderText: "text-slate-500",
    accentBg: "bg-slate-50",
    softBg: "bg-slate-100",
    softText: "text-slate-800",
    border: "border-slate-200",
    borderStrong: "border-slate-300",
    hoverBg: "hover:bg-slate-100",
    focusRing: "focus:ring-slate-300",
    accentButton: "bg-slate-900 hover:bg-slate-800 text-white",
    headerText: "text-slate-900",
  },
  green: {
    name: "Garden Green",
    appBg: "bg-emerald-50",
    header: "from-emerald-700 to-teal-800",
    activeTab: "bg-emerald-800 text-white",
    inactiveTab: "border-emerald-100 bg-white text-emerald-800",
    accentText: "text-emerald-700",
    strongText: "text-emerald-900",
    mutedHeaderText: "text-emerald-100",
    accentBg: "bg-emerald-50",
    softBg: "bg-emerald-100",
    softText: "text-emerald-800",
    border: "border-emerald-100",
    borderStrong: "border-emerald-300",
    hoverBg: "hover:bg-emerald-50",
    focusRing: "focus:ring-emerald-300",
    accentButton: "bg-emerald-700 hover:bg-emerald-800 text-white",
    headerText: "text-white",
  },
  blue: {
    name: "Clean Blue",
    appBg: "bg-sky-50",
    header: "from-sky-700 to-blue-800",
    activeTab: "bg-sky-800 text-white",
    inactiveTab: "border-sky-100 bg-white text-sky-800",
    accentText: "text-sky-700",
    strongText: "text-sky-900",
    mutedHeaderText: "text-sky-100",
    accentBg: "bg-sky-50",
    softBg: "bg-sky-100",
    softText: "text-sky-800",
    border: "border-sky-100",
    borderStrong: "border-sky-300",
    hoverBg: "hover:bg-sky-50",
    focusRing: "focus:ring-sky-300",
    accentButton: "bg-sky-700 hover:bg-sky-800 text-white",
    headerText: "text-white",
  },
  charcoal: {
    name: "Charcoal",
    appBg: "bg-slate-100",
    header: "from-slate-950 to-slate-800",
    headerText: "text-white",
    accentText: "text-slate-900",
    strongText: "text-slate-950",
    softText: "text-slate-700",
    accentBg: "bg-slate-100",
    softBg: "bg-slate-100",
    hoverBg: "hover:bg-slate-100",
    border: "border-slate-200",
    borderStrong: "border-slate-300",
    accentButton: "bg-slate-950 text-white hover:bg-slate-800",
    focusRing: "focus:ring-slate-400",
  },
  sand: {
    name: "Warm Sand",
    appBg: "bg-orange-50",
    header: "from-orange-700 to-amber-800",
    activeTab: "bg-orange-800 text-white",
    inactiveTab: "border-orange-100 bg-white text-orange-800",
    accentText: "text-orange-700",
    strongText: "text-orange-900",
    mutedHeaderText: "text-orange-100",
    accentBg: "bg-orange-50",
    softBg: "bg-orange-100",
    softText: "text-orange-800",
    border: "border-orange-100",
    borderStrong: "border-orange-300",
    hoverBg: "hover:bg-orange-50",
    focusRing: "focus:ring-orange-300",
    accentButton: "bg-orange-700 hover:bg-orange-800 text-white",
    headerText: "text-white",
  },
  purple: {
    name: "Soft Purple",
    appBg: "bg-violet-50",
    header: "from-violet-700 to-purple-800",
    activeTab: "bg-violet-800 text-white",
    inactiveTab: "border-violet-100 bg-white text-violet-800",
    accentText: "text-violet-700",
    strongText: "text-violet-900",
    mutedHeaderText: "text-violet-100",
    accentBg: "bg-violet-50",
    softBg: "bg-violet-100",
    softText: "text-violet-800",
    border: "border-violet-100",
    borderStrong: "border-violet-300",
    hoverBg: "hover:bg-violet-50",
    focusRing: "focus:ring-violet-300",
    accentButton: "bg-violet-700 hover:bg-violet-800 text-white",
    headerText: "text-white",
  },
  rose: {
    name: "Rose",
    appBg: "bg-rose-50",
    header: "from-rose-700 to-pink-800",
    activeTab: "bg-rose-800 text-white",
    inactiveTab: "border-rose-100 bg-white text-rose-800",
    accentText: "text-rose-700",
    strongText: "text-rose-900",
    mutedHeaderText: "text-rose-100",
    accentBg: "bg-rose-50",
    softBg: "bg-rose-100",
    softText: "text-rose-800",
    border: "border-rose-100",
    borderStrong: "border-rose-300",
    hoverBg: "hover:bg-rose-50",
    focusRing: "focus:ring-rose-300",
    accentButton: "bg-rose-700 hover:bg-rose-800 text-white",
    headerText: "text-white",
  },
  lime: {
    name: "Fresh Lime",
    appBg: "bg-lime-50",
    header: "from-lime-700 to-green-800",
    activeTab: "bg-lime-800 text-white",
    inactiveTab: "border-lime-100 bg-white text-lime-800",
    accentText: "text-lime-700",
    strongText: "text-lime-900",
    mutedHeaderText: "text-lime-100",
    accentBg: "bg-lime-50",
    softBg: "bg-lime-100",
    softText: "text-lime-800",
    border: "border-lime-100",
    borderStrong: "border-lime-300",
    hoverBg: "hover:bg-lime-50",
    focusRing: "focus:ring-lime-300",
    accentButton: "bg-lime-700 hover:bg-lime-800 text-white",
    headerText: "text-white",
  },
  indigo: {
    name: "Indigo",
    appBg: "bg-indigo-50",
    header: "from-indigo-700 to-slate-900",
    activeTab: "bg-indigo-800 text-white",
    inactiveTab: "border-indigo-100 bg-white text-indigo-800",
    accentText: "text-indigo-700",
    strongText: "text-indigo-900",
    mutedHeaderText: "text-indigo-100",
    accentBg: "bg-indigo-50",
    softBg: "bg-indigo-100",
    softText: "text-indigo-800",
    border: "border-indigo-100",
    borderStrong: "border-indigo-300",
    hoverBg: "hover:bg-indigo-50",
    focusRing: "focus:ring-indigo-300",
    accentButton: "bg-indigo-700 hover:bg-indigo-800 text-white",
    headerText: "text-white",
  },
  teal: {
    name: "Ocean Teal",
    appBg: "bg-teal-50",
    header: "from-teal-700 to-cyan-800",
    activeTab: "bg-teal-800 text-white",
    inactiveTab: "border-teal-100 bg-white text-teal-800",
    accentText: "text-teal-700",
    strongText: "text-teal-900",
    mutedHeaderText: "text-teal-100",
    accentBg: "bg-teal-50",
    softBg: "bg-teal-100",
    softText: "text-teal-800",
    border: "border-teal-100",
    borderStrong: "border-teal-300",
    hoverBg: "hover:bg-teal-50",
    focusRing: "focus:ring-teal-300",
    accentButton: "bg-teal-700 hover:bg-teal-800 text-white",
    headerText: "text-white",
  },
};

const initialClients = [
  {
    id: 1,
    name: "John Doe",
    sheetKey: "John Doe",
    invoiceName: "John Doe",
    suburb: "New Farm",
    address: "New Farm, QLD",
    phone: "",
    email: "",
    accessInfo: "Gate code: 4281#\nDo not block driveway.\nSide gate access.",
    scheduleDay: "Monday",
    frequency: "Fortnightly",
    nextVisit: "2026-05-18",
    activeNotes: [
      { id: 101, text: "Cut hedge back to the line of the driveway next visit.", createdAt: "2026-05-04", photo: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=900&q=80" },
      { id: 102, text: "Check irrigation near back fence.", createdAt: "2026-05-04", photo: null },
    ],
    activeAlerts: [{ id: 501, text: "Take wheelbarrow for this job.", createdAt: "2026-05-16" }],
    completedNotes: [{ id: 1001, text: "Trimmed front hedge and cleaned green waste.", completedAt: "2026-05-04", photo: null }],
    visitHistory: ["2026-05-04", "2026-04-20", "2026-04-06"],
    completedDates: [],
      oneOffJobs: [],
  },
  {
    id: 2,
    name: "Mary Smith",
    sheetKey: "Mary Smith",
    invoiceName: "Mary Smith",
    suburb: "Teneriffe",
    address: "Teneriffe, QLD",
    phone: "",
    email: "",
    accessInfo: "Street parking only.\nConfirm gate code before arrival.",
    scheduleDay: "Monday",
    frequency: "Weekly",
    nextVisit: "2026-05-18",
    activeNotes: [
      { id: 201, text: "Gate code changed recently. Confirm before arrival.", createdAt: "2026-05-11", photo: null },
      { id: 202, text: "Front garden only. Avoid parking across driveway.", createdAt: "2026-05-11", photo: null },
    ],
    activeAlerts: [],
    completedNotes: [],
    visitHistory: ["2026-05-11", "2026-05-04", "2026-04-27"],
    completedDates: [],
      oneOffJobs: [],
  },
  {
    id: 3,
    name: "Riverside Apartments",
    sheetKey: "Riverside Apartments",
    invoiceName: "Riverside Apartments",
    suburb: "West End",
    address: "West End, QLD",
    phone: "",
    email: "",
    accessInfo: "Manager access required.\nLoading bay when available.\nAsk building manager before rooftop access.",
    scheduleDay: "Wednesday",
    frequency: "Every 3 weeks",
    nextVisit: "2026-05-20",
    activeNotes: [
      { id: 301, text: "Rooftop pots: check wind damage and sunburn on succulents.", createdAt: "2026-04-29", photo: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80" },
      { id: 302, text: "Ask manager before spraying near cafe area.", createdAt: "2026-04-29", photo: null },
    ],
    activeAlerts: [{ id: 502, text: "Bring extra hose fitting for rooftop irrigation.", createdAt: "2026-05-16" }],
    completedNotes: [{ id: 3001, text: "Applied slow-release fertiliser to rooftop pots.", completedAt: "2026-04-29", photo: null }],
    visitHistory: ["2026-04-29", "2026-04-08", "2026-03-18"],
    completedDates: [],
      oneOffJobs: [],
  },
  {
    id: 4,
    name: "One-off: Brown Residence",
    sheetKey: "One-off: Brown Residence",
    invoiceName: "Brown Residence",
    suburb: "Paddington",
    address: "Paddington, QLD",
    phone: "",
    email: "",
    accessInfo: "Confirm access before going.",
    scheduleDay: "Friday",
    frequency: "One-off / call when needed",
    nextVisit: "2026-05-22",
    activeNotes: [{ id: 401, text: "Confirm access before going. They usually need a big clean-up before family visits.", createdAt: "2026-02-14", photo: null }],
    activeAlerts: [],
    completedNotes: [{ id: 4001, text: "Heavy pruning, trailer load of green waste, and general tidy-up.", completedAt: "2026-02-14", photo: null }],
    visitHistory: ["2026-02-14", "2025-11-29", "2025-08-02"],
    completedDates: [],
      oneOffJobs: [],
  },
];

function daysAgo(dateString) {
  const currentDate = new Date(`${today}T12:00:00`);
  const date = new Date(`${dateString}T12:00:00`);
  const diff = Math.round((currentDate - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 35) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function isWithinNext48Hours(dateString) {
  if (!dateString) return false;
  const currentDate = new Date(`${today}T12:00:00`);
  const date = new Date(`${dateString}T12:00:00`);
  const diffHours = (date - currentDate) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 48;
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function shortDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function dateWeekday(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" });
}

function daysBetweenIso(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function nextDateForWeekday(weekday, fromIso) {
  const start = new Date(`${fromIso || getTodayIso()}T12:00:00`);
  for (let i = 0; i < 14; i += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    const iso = toLocalIsoDate(candidate);
    if (dateWeekday(iso) === weekday) return iso;
  }
  return fromIso || getTodayIso();
}

function shouldShowRecurringJob(client, date) {
  if (!client?.scheduleDay || !date) return false;
  if (client.scheduleDay !== dateWeekday(date)) return false;

  const frequency = client.frequency || "Weekly";

  // Weekly should always show on the selected weekday.
  // This avoids jobs disappearing if nextVisit is blank or slightly wrong.
  if (frequency === "Weekly") return true;

  const startDate = client.nextVisit || date;
  const diff = daysBetweenIso(startDate, date);

  if (frequency === "Fortnightly") return diff % 14 === 0;
  if (frequency === "Every 3 weeks") return diff % 21 === 0;
  if (frequency === "Monthly") {
    return new Date(`${date}T12:00:00`).getDate() === new Date(`${startDate}T12:00:00`).getDate();
  }

  return true;
}

function getWeekDates() {
  const current = new Date(`${today}T12:00:00`);
  const dayIndex = current.getDay();
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = new Date(current);
  monday.setDate(current.getDate() - daysFromMonday);

  return weekdays.reduce((dates, day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates[day] = toLocalIsoDate(date);
    return dates;
  }, {});
}

function getMonthDays(monthOffset = 0) {
  const current = new Date(`${today}T12:00:00`);
  const firstDay = new Date(current.getFullYear(), current.getMonth() + monthOffset, 1);
  const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days = [];

  for (let i = 0; i < startPadding; i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    days.push(toLocalIsoDate(date));
  }
  return days;
}

function monthTitle(monthOffset = 0) {
  const current = new Date(`${today}T12:00:00`);
  const date = new Date(current.getFullYear(), current.getMonth() + monthOffset, 1);
  return date.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

function googleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
}

function getReminderPreview(client) {
  const note = client.activeAlerts?.[0]?.text || "scheduled request";
  return `Don’t forget: ${note} — ${client.name}`;
}

const CLIENTS_STORAGE_KEY = "exton_scheduler_clients_v2";
const APP_SETTINGS_STORAGE_KEY = "exton_scheduler_app_settings_v1";

function normaliseImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const idFromUc = value.match(/[?&]id=([^&]+)/);
  if (value.includes("drive.google.com/uc") && idFromUc?.[1]) {
    return `https://drive.google.com/thumbnail?id=${idFromUc[1]}&sz=w1600`;
  }
  const idFromFile = value.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (idFromFile?.[1]) {
    return `https://drive.google.com/thumbnail?id=${idFromFile[1]}&sz=w1600`;
  }
  return value;
}

function getInitialAppSettings() {
  try {
    const saved = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn("Could not load app settings locally:", error);
  }
  return {};
}

function saveAppSettingsLocally(settings) {
  try {
    const current = getInitialAppSettings();
    const next = { ...current, ...settings };
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Could not save app settings locally:", error);
  }
}

function generateRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function postToSheets(payload) {
  try {
    const iframeName = "sheets-submit-frame";
    let iframe = document.querySelector(`iframe[name="${iframeName}"]`);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = GOOGLE_SCRIPT_WEBAPP_URL;
    form.target = iframeName;
    form.style.display = "none";

    const input = document.createElement("input");
    input.name = "payload";
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    console.log("Submitted to Google Sheets:", payload);
    return true;
  } catch (error) {
    console.error("Sheet submit failed:", error);
    return false;
  }
}

function settingsArrayToObject(settingsRows) {
  const result = {};
  if (!Array.isArray(settingsRows)) return result;
  settingsRows.forEach((row) => {
    if (!row?.settingKey) return;
    result[String(row.settingKey)] = row.settingValue || "";
  });
  return result;
}

function saveAppSettings(settings, logoData = "") {
  const cleanedSettings = {
    ...settings,
    businessLogoUrl: normaliseImageUrl(settings?.businessLogoUrl || ""),
  };
  saveAppSettingsLocally(cleanedSettings);
  postToSheets({
    action: "saveAppSettings",
    settings: cleanedSettings,
    logoData,
  });
}

function compressImageFile(file, options = {}) {
  const maxSize = options.maxSize || 1600;
  const quality = options.quality || 0.75;

  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load image for compression."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function isDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

async function fetchSheetsDatabase() {
  const url = `${GOOGLE_SCRIPT_WEBAPP_URL}?action=getDatabase&ts=${Date.now()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const data = await response.json();
  if (data?.status === "error") throw new Error(data.message || "Sheets returned an error");
  return data;
}

function buildClientsFromDatabase(data) {
  const clientsRows = Array.isArray(data?.clients) ? data.clients : [];
  const recurringRows = Array.isArray(data?.recurringJobs) ? data.recurringJobs : [];
  const oneOffRows = Array.isArray(data?.oneOffJobs) ? data.oneOffJobs : [];
  const notesRows = Array.isArray(data?.clientNotes) ? data.clientNotes : [];
  const alertsRows = Array.isArray(data?.clientAlerts) ? data.clientAlerts : [];
  const visitsRows = Array.isArray(data?.visitHistory) ? data.visitHistory : [];

  return clientsRows
    .filter((row) => row.clientId && row.nickname)
    .map((row, index) => {
      const clientId = String(row.clientId);
      const recurring = recurringRows.find((job) => job.clientId === clientId && (job.status || "active") === "active");
      const activeNotes = notesRows
        .filter((note) => note.clientId === clientId && (note.status || "active") === "active")
        .map((note) => ({ id: note.noteId, text: note.text || "", createdAt: note.createdAt || today, photo: normaliseImageUrl(note.photoUrl) || null }));
      const completedClientNotes = notesRows
        .filter((note) => note.clientId === clientId && note.status === "completed")
        .map((note) => ({ id: note.noteId, text: note.text || "", completedAt: note.completedAt || note.createdAt || today, photo: normaliseImageUrl(note.photoUrl) || null }));
      const activeAlerts = alertsRows
        .filter((alert) => alert.clientId === clientId && (alert.status || "active") === "active")
        .map((alert) => ({ id: alert.alertId, text: alert.text || "", alertDate: alert.alertDate || today, createdAt: alert.createdAt || today }));
      const clientVisits = visitsRows
        .filter((visit) => visit.clientId === clientId)
        .sort((a, b) => String(b.visitDate || "").localeCompare(String(a.visitDate || "")));
      const visitDates = clientVisits.map((visit) => displayToIsoDate(visit.visitDate) || visit.visitDate).filter(Boolean);
      const visitNotes = clientVisits.map((visit) => ({
        id: visit.visitId,
        text: `Visit done ${formatDate(displayToIsoDate(visit.visitDate) || visit.visitDate)}`,
        completedAt: displayToIsoDate(visit.visitDate) || visit.visitDate,
        type: "visit",
        photo: null,
      }));
      const oneOffJobs = oneOffRows
        .filter((job) => job.clientId === clientId && (job.status || "active") === "active")
        .map((job) => ({ id: job.oneOffJobId, date: displayToIsoDate(job.date) || job.date }));

      const address = row.address || "";
      return {
        id: clientId,
        clientId,
        name: row.nickname || row.invoiceName || `Client ${index + 1}`,
        sheetKey: row.nickname || row.invoiceName || `Client ${index + 1}`,
        invoiceName: row.invoiceName || row.nickname || `Client ${index + 1}`,
        suburb: address ? String(address).split(",")[0] : "Suburb",
        address,
        phone: row.phone || "",
        email: row.email || "",
        accessInfo: row.notes || "",
        recurringJobId: recurring?.recurringJobId || "",
        scheduleDay: recurring?.scheduleDay || "",
        frequency: recurring?.frequency || "",
        nextVisit: displayToIsoDate(recurring?.nextVisit || "") || recurring?.nextVisit || "",
        activeNotes,
        activeAlerts,
        completedNotes: [...visitNotes, ...completedClientNotes],
        visitHistory: visitDates,
        completedDates: visitDates,
        oneOffJobs,
      };
    });
}

function getInitialClients() {
  try {
    const saved = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load saved clients:", error);
  }
  return [];
}

function InnerApp() {
  const [clients, setClients] = useState(getInitialClients);
  const [selectedClientId, setSelectedClientId] = useState(1);
  const [activePage, setActivePage] = useState("schedule");
  const [search, setSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newAlert, setNewAlert] = useState("");
  const [newAlertDate, setNewAlertDate] = useState(isoToDisplayDate(today));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingNotePhoto, setEditingNotePhoto] = useState(null);
  const [editingAlertId, setEditingAlertId] = useState(null);
  const [editingAlertText, setEditingAlertText] = useState("");
  const [editingAlertDate, setEditingAlertDate] = useState(isoToDisplayDate(today));
  const [newPhoto, setNewPhoto] = useState(null);
  const initialAppSettings = getInitialAppSettings();
  const [businessName, setBusinessName] = useState(initialAppSettings.businessName || "Your Business Name");
  const [headerSubtitle, setHeaderSubtitle] = useState(initialAppSettings.headerSubtitle || "Weekly Schedule");
  const [businessLogo, setBusinessLogo] = useState(normaliseImageUrl(initialAppSettings.businessLogoUrl) || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=300&q=80");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [colourScheme, setColourScheme] = useState(initialAppSettings.colourScheme || "green");
  const [visitSubmitStatus, setVisitSubmitStatus] = useState("idle");
  const [clientSubmitStatus, setClientSubmitStatus] = useState("idle");
  const [clientEditStatus, setClientEditStatus] = useState("idle");
  const [visitForm, setVisitForm] = useState({ date: isoToDisplayDate(today), totalHours: "", totalMaterials: "", notesMaterials: "" });
  const [visitFormError, setVisitFormError] = useState("");
  const [selectedMonthDate, setSelectedMonthDate] = useState(today);
  const [selectedVisitDate, setSelectedVisitDate] = useState(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [quickJob, setQuickJob] = useState({ name: "", suburb: "", address: "", date: isoToDisplayDate(today) });
  const [newClientForm, setNewClientForm] = useState({ name: "", invoiceName: "", suburb: "", address: "", phone: "", email: "", accessInfo: "", frequency: "", scheduleDay: "", oneOffDate: isoToDisplayDate(today) });
  const [oneOffJobDate, setOneOffJobDate] = useState(isoToDisplayDate(today));
  const [syncStatus, setSyncStatus] = useState("loading");
  const [imageViewerUrl, setImageViewerUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSheetsData() {
      try {
        setSyncStatus("loading");
        const database = await fetchSheetsDatabase();
        if (cancelled) return;
        const loadedClients = buildClientsFromDatabase(database);
        const appSettings = settingsArrayToObject(database?.appSettings);
        setClients(loadedClients);
        if (loadedClients.length > 0) setSelectedClientId(loadedClients[0].id);
        if (appSettings.businessName) setBusinessName(appSettings.businessName);
        if (appSettings.headerSubtitle) setHeaderSubtitle(appSettings.headerSubtitle);
        if (appSettings.businessLogoUrl) setBusinessLogo(normaliseImageUrl(appSettings.businessLogoUrl));
        if (appSettings.colourScheme && colourSchemes[appSettings.colourScheme]) setColourScheme(appSettings.colourScheme);
        saveAppSettingsLocally({
          businessName: appSettings.businessName || businessName,
          headerSubtitle: appSettings.headerSubtitle || headerSubtitle,
          businessLogoUrl: normaliseImageUrl(appSettings.businessLogoUrl) || businessLogo,
          colourScheme: appSettings.colourScheme || colourScheme,
        });
        setSyncStatus("synced");
      } catch (error) {
        console.error("Could not load data from Sheets:", error);
        if (!cancelled) setSyncStatus("offline-cache");
      }
    }

    loadSheetsData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.warn("Could not save clients locally:", error);
    }
  }, [clients]);

  const theme = colourSchemes[colourScheme] || colourSchemes.green;
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  const visitMarkedToday = Boolean(selectedClient?.completedDates?.includes(selectedVisitDate || today));
  const weekDates = useMemo(() => getWeekDates(), []);
  const monthDays = useMemo(() => getMonthDays(monthOffset), [monthOffset]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => `${client.name} ${client.suburb}`.toLowerCase().includes(search.toLowerCase()));
  }, [clients, search]);

  const sortedByLastDone = useMemo(() => {
    return [...filteredClients].sort((a, b) => new Date(a.visitHistory?.[0] || "1900-01-01") - new Date(b.visitHistory?.[0] || "1900-01-01"));
  }, [filteredClients]);

  const selectedMonthDayName = dateWeekday(selectedMonthDate);
  const selectedMonthClients = jobsForDay(selectedMonthDayName, selectedMonthDate);
  const upcomingAlerts = clients.filter((client) => (client.activeAlerts || []).some((alert) => isWithinNext48Hours(alert.alertDate || client.nextVisit)));
  function jobsForDay(day, date) {
    const recurringJobs = clients
      .filter((client) => shouldShowRecurringJob(client, date))
      .map((client) => ({
        client,
        date,
        type: "recurring",
      }));

    const oneOffJobs = clients.flatMap((client) =>
      (client.oneOffJobs || [])
        .filter((job) => job.date === date)
        .map((job) => ({
          client,
          date,
          type: "one-off",
          job,
        }))
    );

    return [...recurringJobs, ...oneOffJobs];
  }

  function addOneOffJobForSelectedClient() {
    if (!selectedClient) return;

    const isoDate = displayToIsoDate(oneOffJobDate) || today;
    const oneOffJobId = generateRecordId("OOJ");

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              oneOffJobs: [
                ...(client.oneOffJobs || []),
                {
                  id: oneOffJobId,
                  date: isoDate,
                },
              ],
            }
          : client
      )
    );

    postToSheets({
      action: "saveOneOffJob",
      oneOffJobId,
      clientId: selectedClient.clientId || selectedClient.id,
      date: isoToDisplayDate(isoDate),
      status: "active",
      createdAt: today,
    });

    setOneOffJobDate(isoToDisplayDate(today));
    setActivePage("schedule");
  }

  function deleteOneOffJob(clientId, jobId) {
    setClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...client,
              oneOffJobs: (client.oneOffJobs || []).filter((job) => job.id !== jobId),
            }
          : client
      )
    );
    postToSheets({ action: "deleteOneOffJob", oneOffJobId: jobId });
  }


  async function createNewClientFromSettings() {
    const name = newClientForm.name.trim();

    if (!name || !newClientForm.invoiceName.trim()) return;

    setClientSubmitStatus("sending");

    const clientId = generateRecordId("CL");

    const newClientData = {
      id: clientId,
      clientId,
      name,
      sheetKey: name,
      invoiceName: newClientForm.invoiceName || name,
      suburb: newClientForm.suburb || "Suburb",
      address: newClientForm.address || "",
      phone: newClientForm.phone || "",
      email: newClientForm.email || "",
      accessInfo: newClientForm.accessInfo || "",
      scheduleDay: "",
      frequency: "",
      nextVisit: "",
      activeNotes: [],
      activeAlerts: [],
      completedNotes: [],
      visitHistory: [],
      completedDates: [],
      oneOffJobs: [],
    };

    const success = await submitClientToSheets(newClientData, "create");

    if (success) {
      setClients((current) => [...current, newClientData]);
      setSelectedClientId(newClientData.id);
      setNewClientForm({ name: "", invoiceName: "", suburb: "", address: "", phone: "", email: "", accessInfo: "", frequency: "", scheduleDay: "", oneOffDate: isoToDisplayDate(today) });
      setClientSubmitStatus("sent");
      setTimeout(() => {
        setClientSubmitStatus("idle");
        setActivePage("settingsClientsEdit");
      }, 700);
    } else {
      setClientSubmitStatus("error");
    }
  }

  function updateSelectedClient(field, value) {
    setClients((current) => current.map((client) => (client.id === selectedClient.id ? { ...client, [field]: value } : client)));
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxSize: 1600, quality: 0.75 });
      setNewPhoto(compressed);
    } catch (error) {
      console.error("Photo compression failed:", error);
      alert("Could not prepare this photo. Please try another image.");
    }
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxSize: 1000, quality: 0.82 });
      setBusinessLogo(compressed);
    } catch (error) {
      console.error("Logo compression failed:", error);
      alert("Could not prepare this logo. Please try another image.");
    }
  }

  function saveHeaderSettingsAndClose() {
    saveAppSettings(
      {
        businessName,
        headerSubtitle,
        colourScheme,
        businessLogoUrl: isDataImage(businessLogo) ? "" : businessLogo,
      },
      isDataImage(businessLogo) ? businessLogo : ""
    );
    setIsEditingHeader(false);
  }

  function chooseColourScheme(key) {
    setColourScheme(key);
    saveAppSettings({ colourScheme: key });
  }

  function addNote() {
    const text = newNote.trim();
    if (!text && !newPhoto) return;
    const noteId = generateRecordId("NOTE");
    const note = { id: noteId, text: text || "Photo reminder", createdAt: today, photo: newPhoto };

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              activeNotes: [...client.activeNotes, note],
            }
          : client
      )
    );

    postToSheets({
      action: "saveNote",
      noteId,
      clientId: selectedClient.clientId || selectedClient.id,
      text: note.text,
      photoUrl: isDataImage(newPhoto) ? "" : newPhoto || "",
      photoData: isDataImage(newPhoto) ? newPhoto : "",
      status: "active",
      createdAt: today,
    });

    setNewNote("");
    setNewPhoto(null);
  }

  function deleteNote(noteId) {
    setClients((current) => current.map((client) => (client.id === selectedClient.id ? { ...client, activeNotes: client.activeNotes.filter((note) => note.id !== noteId) } : client)));
    postToSheets({ action: "deleteNote", noteId });
  }

  function completeNote(noteId) {
    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) return client;
        const noteToComplete = client.activeNotes.find((note) => note.id === noteId);
        if (!noteToComplete) return client;
        postToSheets({ action: "completeNote", noteId });
        return {
          ...client,
          activeNotes: client.activeNotes.filter((note) => note.id !== noteId),
          completedNotes: [{ id: noteToComplete.id, text: noteToComplete.text, completedAt: today, photo: noteToComplete.photo }, ...client.completedNotes],
        };
      })
    );
  }

  function restoreCompletedNote(noteId) {
    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) return client;
        const noteToRestore = client.completedNotes.find((note) => note.id === noteId);
        if (!noteToRestore) return client;
        postToSheets({ action: "restoreNote", noteId });
        return {
          ...client,
          completedNotes: client.completedNotes.filter((note) => note.id !== noteId),
          activeNotes: [{ id: noteToRestore.id, text: noteToRestore.text, createdAt: today, photo: noteToRestore.photo }, ...client.activeNotes],
        };
      })
    );
  }

  function submitVisitForm() {
    const dateIsValid = isValidDisplayDate(visitForm.date);
    const hasRequiredFields = visitForm.totalHours.trim() && visitForm.totalMaterials.trim();
    if (!dateIsValid || !hasRequiredFields) {
      setVisitFormError("Please fill Date, Total hours and Total materials. Date must be dd/mm/yyyy.");
      return;
    }

    const visitDate = displayToIsoDate(visitForm.date) || selectedVisitDate || today;
    setVisitFormError("");
    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) return client;
        const visitHistory = client.visitHistory.includes(visitDate) ? client.visitHistory : [visitDate, ...client.visitHistory];
        const completedDates = client.completedDates?.includes(visitDate) ? client.completedDates : [...(client.completedDates || []), visitDate];
        const visitHistoryItemExists = (client.completedNotes || []).some((note) => note.type === "visit" && note.completedAt === visitDate);
        const completedNotes = visitHistoryItemExists
          ? client.completedNotes
          : [
              {
                id: Date.now(),
                text: `Visit done ${formatDate(visitDate)}`,
                completedAt: visitDate,
                type: "visit",
                photo: null,
              },
              ...(client.completedNotes || []),
            ];
        return { ...client, visitHistory, completedDates, completedNotes };
      })
    );
    setActivePage("details");
  }

  function deleteClient(clientId) {
    const remainingClients = clients.filter((client) => client.id !== clientId);
    setClients(remainingClients);
    postToSheets({ action: "deleteClient", clientId });
    if (remainingClients.length > 0) setSelectedClientId(remainingClients[0].id);
    setActivePage("schedule");
  }

  function openMonthDate(date) {
    if (!date) return;
    setSelectedMonthDate(date);
    setActivePage("monthDay");
  }

  function rescheduleClient(clientId, newDay) {
    setClients((current) => current.map((client) => (client.id === clientId ? { ...client, scheduleDay: newDay } : client)));
    setDraggedClientId(null);
  }

  function addQuickJob() {
    if (!quickJob.name.trim()) return;
    const clientId = generateRecordId("CL");
    const oneOffJobId = generateRecordId("OOJ");

    const newClientData = {
      id: clientId,
      clientId,
      name: `One-off: ${quickJob.name.trim()}`,
      sheetKey: `One-off: ${quickJob.name.trim()}`,
      invoiceName: quickJob.name.trim(),
      suburb: quickJob.suburb || "Suburb",
      address: quickJob.address || quickJob.suburb || "",
      phone: "",
      email: "",
      accessInfo: "",
      scheduleDay: dateWeekday(displayToIsoDate(quickJob.date) || today),
      frequency: "One-off / call when needed",
      nextVisit: displayToIsoDate(quickJob.date) || today,
      activeNotes: [],
      activeAlerts: [],
      completedNotes: [],
      visitHistory: [],
      completedDates: [],
      oneOffJobs: [{ id: oneOffJobId, date: displayToIsoDate(quickJob.date) || today }],
    };
    postToSheets({
      action: "saveClient",
      mode: "create",
      clientId,
      nickname: newClientData.name,
      invoiceName: newClientData.invoiceName,
      address: newClientData.address,
      phone: "",
      email: "",
      notes: "",
    });
    postToSheets({
      action: "saveOneOffJob",
      oneOffJobId,
      clientId,
      date: quickJob.date,
      status: "active",
      createdAt: today,
    });
    setClients((current) => [...current, newClientData]);
    setQuickJob({ name: "", suburb: "", address: "", date: isoToDisplayDate(today) });
    setActivePage("schedule");
  }

  function addExampleClient() {
    const clientId = generateRecordId("CL");

    const newClientData = {
      id: clientId,
      clientId,
      name: "New Client",
      sheetKey: "New Client",
      invoiceName: "New Client",
      suburb: "Suburb",
      address: "",
      phone: "",
      email: "",
      accessInfo: "",
      scheduleDay: "Tuesday",
      frequency: "Fortnightly",
      nextVisit: "2026-05-19",
      activeNotes: [],
      activeAlerts: [],
      completedNotes: [],
      visitHistory: [],
      completedDates: [],
      oneOffJobs: [],
    };
    setClients((current) => [...current, newClientData]);
    setSelectedClientId(newClientData.id);
    setActivePage("settingsClientsEdit");
  }

  function isOneOffFrequency(frequency) {
    return frequency === "One-off / call when needed";
  }

  function updateSelectedFrequency(value) {
    updateSelectedClient("frequency", value);
  }

  function updateSelectedOneOffDate(displayDate) {
    setOneOffJobDate(displayDate);
  }

  function createJobForSelectedClient() {
    if (!selectedClient) return;

    const frequency = selectedClient.frequency || "Weekly";
    const scheduleDay = selectedClient.scheduleDay || "Monday";
    const nextVisit = nextDateForWeekday(scheduleDay, today) || today;
    const recurringJobId = selectedClient.recurringJobId || generateRecordId("RJ");

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              recurringJobId,
              frequency,
              scheduleDay,
              nextVisit,
            }
          : client
      )
    );

    postToSheets({
      action: "saveRecurringJob",
      recurringJobId,
      clientId: selectedClient.clientId || selectedClient.id,
      frequency,
      scheduleDay,
      nextVisit: isoToDisplayDate(nextVisit),
      status: "active",
      createdAt: today,
    });

    setActivePage("schedule");
  }

  function deleteJobForSelectedClient() {
    if (!selectedClient) return;
    const confirmed = window.confirm(`Delete the scheduled job for ${selectedClient.name}?`);
    if (!confirmed) return;

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              recurringJobId: "",
              frequency: "One-off / call when needed",
              nextVisit: "",
              scheduleDay: "",
              completedDates: [],
              oneOffJobs: [],
            }
          : client
      )
    );
    if (selectedClient.recurringJobId) {
      postToSheets({ action: "deleteRecurringJob", recurringJobId: selectedClient.recurringJobId });
    }
  }

  function addAlert() {
    const text = newAlert.trim();
    const alertDate = displayToIsoDate(newAlertDate) || today;
    if (!text) return;
    const alertId = generateRecordId("ALERT");
    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? { ...client, activeAlerts: [...(client.activeAlerts || []), { id: alertId, text, alertDate, createdAt: today }] }
          : client
      )
    );
    postToSheets({
      action: "saveAlert",
      alertId,
      clientId: selectedClient.clientId || selectedClient.id,
      text,
      alertDate: isoToDisplayDate(alertDate),
      status: "active",
      createdAt: today,
    });
    setNewAlert("");
    setNewAlertDate(isoToDisplayDate(today));
  }

  function deleteAlert(alertId) {
    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? { ...client, activeAlerts: (client.activeAlerts || []).filter((alert) => alert.id !== alertId) }
          : client
      )
    );
    postToSheets({ action: "deleteAlert", alertId });
  }

  function completeAlert(alertId) {
    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? { ...client, activeAlerts: (client.activeAlerts || []).filter((alert) => alert.id !== alertId) }
          : client
      )
    );
    postToSheets({ action: "completeAlert", alertId });
  }

  function startEditNote(note) {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text || "");
    setEditingNotePhoto(note.photo || null);
    setActivePage("editNote");
  }

  function saveEditedNote() {
    const text = editingNoteText.trim();
    if (!text) return;

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              activeNotes: client.activeNotes.map((note) =>
                note.id === editingNoteId ? { ...note, text, photo: editingNotePhoto } : note
              ),
            }
          : client
      )
    );

    postToSheets({
      action: "updateNote",
      noteId: editingNoteId,
      clientId: selectedClient.clientId || selectedClient.id,
      text,
      photoUrl: isDataImage(editingNotePhoto) ? "" : editingNotePhoto || "",
      photoData: isDataImage(editingNotePhoto) ? editingNotePhoto : "",
      status: "active",
      createdAt: today,
    });

    setEditingNoteId(null);
    setEditingNoteText("");
    setEditingNotePhoto(null);
    setActivePage("details");
  }

  function startEditAlert(alert) {
    setEditingAlertId(alert.id);
    setEditingAlertText(alert.text || "");
    setEditingAlertDate(isoToDisplayDate(alert.alertDate || today));
    setActivePage("editAlert");
  }

  function saveEditedAlert() {
    const text = editingAlertText.trim();
    const alertDate = displayToIsoDate(editingAlertDate) || today;
    if (!text) return;

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              activeAlerts: (client.activeAlerts || []).map((alert) =>
                alert.id === editingAlertId ? { ...alert, text, alertDate } : alert
              ),
            }
          : client
      )
    );

    postToSheets({
      action: "updateAlert",
      alertId: editingAlertId,
      clientId: selectedClient.clientId || selectedClient.id,
      text,
      alertDate: isoToDisplayDate(alertDate),
      status: "active",
      createdAt: today,
    });

    setEditingAlertId(null);
    setEditingAlertText("");
    setEditingAlertDate(isoToDisplayDate(today));
    setActivePage("details");
  }

 async function submitClientToSheets(clientData, mode = "create") {
  try {
    return submitVisitToSheetsFallback({
      action: "saveClient",
      mode,
      clientId: clientData.clientId || clientData.id || generateRecordId("CL"),
      originalNickname: clientData.sheetKey || clientData.name || "",
      nickname: clientData.name || "",
      invoiceName: clientData.invoiceName || clientData.name || "",
      address: clientData.address || "",
      phone: clientData.phone || "",
      email: clientData.email || "",
      notes: clientData.accessInfo || "",
    });
  } catch (error) {
    console.error("Could not send client to Sheets:", error);
    return false;
  }
}

  async function saveEditedClientToSheets() {
    if (!selectedClient) return;
    if (!selectedClient.name?.trim() || !(selectedClient.invoiceName || selectedClient.name)?.trim()) {
      setClientEditStatus("error");
      return;
    }

    setClientEditStatus("saving");
    const success = await submitClientToSheets(selectedClient, "update");

    if (success) {
      setClients((current) =>
        current.map((client) =>
          client.id === selectedClient.id
            ? { ...client, sheetKey: selectedClient.name }
            : client
        )
      );
      setClientEditStatus("saved");
      setTimeout(() => setClientEditStatus("idle"), 1200);
    } else {
      setClientEditStatus("error");
    }
  }

  async function submitVisitToSheets(visitData) {
    return postToSheets(visitData);
  }

  function submitVisitToSheetsFallback(visitData) {
    return postToSheets(visitData);
  }

  function handleMonthTouchEnd(event) {
    if (typeof touchStartX !== "number") return;
    const endX = event.changedTouches?.[0]?.clientX || touchStartX;
    if (endX - touchStartX > 60) setMonthOffset((current) => current - 1);
    if (touchStartX - endX > 60) setMonthOffset((current) => current + 1);
    setTouchStartX(null);
  }

  return (
    <div className={`min-h-screen ${theme.appBg} text-slate-900`}>
      {imageViewerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageViewerUrl(null)}
        >
          <button
            type="button"
            onClick={() => setImageViewerUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
          >
            Close
          </button>
          <img
            src={imageViewerUrl}
            alt="Full size attachment"
            className="max-h-[85vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
      <div className="mx-auto max-w-md px-4 py-5">
        <header className={`mb-4 rounded-3xl bg-gradient-to-br ${theme.header} ${theme.headerText || "text-white"} p-5 shadow-sm`}>
          <div className="grid grid-cols-[6.5rem_1fr_4.8rem] items-center justify-items-center gap-4">
            <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="-ml-1 justify-self-start rounded-2xl p-1 transition hover:bg-black/5">
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-2xl border border-transparent bg-transparent">
                <img src={businessLogo} alt="Business logo" className="h-full w-full object-contain" />
              </div>
            </button>

            <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="min-w-0 justify-self-center rounded-2xl p-1 text-center transition hover:bg-black/5">
              <p className={`text-sm ${theme.mutedHeaderText}`}>{businessName}</p>
              <p className="text-lg font-semibold tracking-tight leading-tight">{headerSubtitle}</p>
            </button>

            <div className="flex flex-col items-stretch justify-center gap-1 justify-self-end">
              <Button onClick={() => { setClientSubmitStatus("idle"); setActivePage("settingsClientsCreate"); }} className={`h-7 rounded-xl bg-white px-2 text-[11px] leading-none ${theme.softText} shadow-sm ${theme.hoverBg}`}>
                <Plus className="mr-0.5 h-3.5 w-3.5" /> Client
              </Button>
              <Button onClick={() => setActivePage("settingsJobsSchedule")} className={`h-7 rounded-xl bg-white px-2 text-[11px] leading-none ${theme.softText} shadow-sm ${theme.hoverBg}`}>
                <Plus className="mr-0.5 h-3.5 w-3.5" /> Job
              </Button>
            </div>
          </div>
        </header>

        {isEditingHeader && (
          <Card className={`mb-4 rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-28 overflow-hidden rounded-2xl border border-transparent bg-transparent">
                  <img src={businessLogo} alt="Business logo preview" className="h-full w-full object-contain" />
                </div>
                <label className={`flex cursor-pointer items-center justify-center rounded-2xl border ${theme.borderStrong} ${theme.accentBg} px-4 py-3 text-sm font-medium ${theme.softText}`}>
                  <Camera className="mr-2 h-4 w-4" /> Change logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
              <TextInput label="Business name" value={businessName} onChange={setBusinessName} theme={theme} />
              <TextInput label="Header subtitle" value={headerSubtitle} onChange={setHeaderSubtitle} theme={theme} />
              <Button onClick={saveHeaderSettingsAndClose} className={`w-full rounded-2xl ${theme.accentButton}`}>Done editing header</Button>
            </CardContent>
          </Card>
        )}

        {isOfflineMode && (
          <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
            Offline mode on — changes will be saved on this phone and synced when internet is back.
          </div>
        )}

        {syncStatus === "loading" && (
          <div className="mb-4 rounded-2xl bg-sky-50 p-3 text-sm font-medium text-sky-900 ring-1 ring-sky-100">
            Loading latest data from Google Sheets...
          </div>
        )}
        {syncStatus === "offline-cache" && (
          <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
            Could not reach Google Sheets. Showing saved data on this device.
          </div>
        )}

        <nav className="mb-4 grid grid-cols-5 gap-2">
          <TabButton active={activePage === "schedule"} onClick={() => setActivePage("schedule")} icon={<CalendarDays />} label="Week" theme={theme} />
          <TabButton active={activePage === "month" || activePage === "monthDay"} onClick={() => setActivePage("month")} icon={<CalendarDays />} label="Month" theme={theme} />
          <TabButton active={activePage === "tasksSelect" || activePage === "details" || activePage === "visitForm" || activePage === "addNote" || activePage === "addAlert" || activePage === "editNote" || activePage === "editAlert"} onClick={() => setActivePage("tasksSelect")} icon={<ClipboardList />} label="Tasks" theme={theme} />
          <TabButton active={activePage === "history" || activePage === "clientHistory"} onClick={() => setActivePage("history")} icon={<History />} label="History" theme={theme} />
          <TabButton active={["settings", "settingsClientsMenu", "settingsClientsCreate", "settingsClientsEdit", "settingsJobsSchedule", "settingsTheme"].includes(activePage)} onClick={() => setActivePage("settings")} icon={<Settings />} label="Settings" theme={theme} />
        </nav>

        {activePage === "schedule" && (
          <>
            {upcomingAlerts.length > 0 && (
              <button
                onClick={() => setActivePage("tasksSelect")}
                className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-amber-950 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-lg font-black text-amber-900">
                  !
                </div>
                <div>
                  <p className="text-sm font-semibold">You have alerts for upcoming jobs</p>
                  <p className="text-xs text-amber-800">Tap to check the client notes and reminders.</p>
                </div>
              </button>
            )}

            <div className="space-y-3">
              {weekdays.map((day) => {
                const dayJobs = jobsForDay(day, weekDates[day]);
                return (
                  <Card key={day} onDragOver={(event) => event.preventDefault()} onDrop={() => draggedClientId && rescheduleClient(draggedClientId, day)} className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <h2 className={`text-lg font-semibold ${theme.strongText}`}>{day}</h2>
                          <span className="text-xs text-slate-400">{shortDate(weekDates[day])}</span>
                        </div>
                        <span className={`rounded-full ${theme.softBg} px-3 py-1 text-xs font-medium ${theme.softText}`}>{dayJobs.length} visit{dayJobs.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="space-y-2">
                        {dayJobs.length === 0 && <p className="text-sm text-slate-400">No clients scheduled.</p>}
                        {dayJobs.map((item) => (
                          <ClientScheduleButton
                            key={`${item.client.id}-${item.type}-${item.job?.id || "recurring"}-${item.date}`}
                            client={item.client}
                            date={item.date}
                            jobType={item.type}
                            theme={theme}
                            onClick={() => {
                              setSelectedClientId(item.client.id);
                              setSelectedVisitDate(item.date);
                              setVisitSubmitStatus("idle");
                              setActivePage("details");
                            }}
                            onDragStart={() => setDraggedClientId(item.client.id)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {activePage === "month" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="p-4" onTouchStart={(event) => setTouchStartX(event.touches?.[0]?.clientX ?? null)} onTouchEnd={handleMonthTouchEnd}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <button onClick={() => setMonthOffset((current) => current - 1)} className={`rounded-2xl border ${theme.borderStrong} bg-white px-3 py-2 text-sm font-medium ${theme.softText} ${theme.hoverBg}`}>←</button>
                <div className="text-center">
                  <p className={`text-sm ${theme.accentText}`}>Monthly schedule</p>
                  <h2 className="text-xl font-bold">{monthTitle(monthOffset)}</h2>
                  <p className="text-xs text-slate-400">Swipe or use arrows</p>
                </div>
                <button onClick={() => setMonthOffset((current) => current + 1)} className={`rounded-2xl border ${theme.borderStrong} bg-white px-3 py-2 text-sm font-medium ${theme.softText} ${theme.hoverBg}`}>→</button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                {weekdays.map((day) => <div key={day}>{day.slice(0, 3)}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((date, index) => {
                  const dayClients = date ? jobsForDay(dateWeekday(date), date) : [];
                  const isToday = date === today;
                  return (
                    <button
                      key={date || `blank-${index}`}
                      onClick={() => openMonthDate(date)}
                      disabled={!date}
                      className={`min-h-20 rounded-xl border p-1 text-left ${date ? `bg-slate-50 ${theme.border} ${theme.hoverBg}` : "border-transparent bg-transparent"} ${isToday ? `ring-2 ${theme.borderStrong}` : ""}`}
                    >
                      {date && (
                        <>
                          <p className={`mb-1 text-[11px] font-bold ${isToday ? theme.accentText : "text-slate-500"}`}>{new Date(`${date}T12:00:00`).getDate()}</p>
                          <div className="space-y-0.5">
                            {dayClients.slice(0, 3).map((item) => (
                              <div
                                key={`${item.client.id}-${item.type}-${item.job?.id || "recurring"}-${date}`}
                                className={`min-h-[18px] truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${
                                  item.client.completedDates?.includes(date)
                                    ? "bg-green-100 text-green-800 line-through"
                                    : item.type === "one-off"
                                    ? "bg-amber-100 text-amber-900"
                                    : `${theme.softBg} ${theme.softText}`
                                }`}
                                title={item.client.name || item.client.invoiceName || "Client"}
                              >
                                {item.client.name || item.client.invoiceName || "Client"}
                              </div>
                            ))}
                            {dayClients.length > 2 && <p className="text-[9px] leading-tight text-slate-400">+{dayClients.length - 2}</p>}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activePage === "monthDay" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle
                eyebrow="Monthly schedule"
                title={new Date(`${selectedMonthDate}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                theme={theme}
              />
              <div className="space-y-2">
                {selectedMonthClients.length === 0 && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No clients scheduled.</p>}
                {selectedMonthClients.map((item) => (
                  <ClientScheduleButton
                    key={`${item.client.id}-${item.type}-${item.job?.id || "recurring"}-${item.date}`}
                    client={item.client}
                    date={item.date}
                    jobType={item.type}
                    theme={theme}
                    onClick={() => {
                      setSelectedClientId(item.client.id);
                      setSelectedVisitDate(item.date);
                      setVisitSubmitStatus("idle");
                      setActivePage("details");
                    }}
                  />
                ))}
              </div>
              <BackButton onClick={() => setActivePage("month")} theme={theme}>Back to month</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "tasksSelect" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Tasks" title="Select client" subtitle="Choose a client to view notes and reminders." theme={theme} />
              <div className="space-y-2">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setVisitSubmitStatus("idle");
                      setActivePage("details");
                    }}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition ${theme.hoverBg}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-slate-500">{client.suburb} · {client.frequency || "No job scheduled"}</p>
                        <p className={`mt-1 text-xs font-medium ${theme.accentText}`}>
                          {client.activeNotes.length} note{client.activeNotes.length === 1 ? "" : "s"} · {(client.activeAlerts || []).length} alert{(client.activeAlerts || []).length === 1 ? "" : "s"}
                        </p>
                      </div>
                      {client.activeNotes.length > 0 && <Bell className={`mt-1 h-4 w-4 ${theme.accentText}`} />}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activePage === "details" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <PageTitle eyebrow="Client tasks" title={selectedClient.name} subtitle={selectedClient.suburb} theme={theme} />
                </div>

                <Button
                  onClick={() => {
                    if (visitMarkedToday) {
                      alert("This visit has already been submitted. To fix a mistake, edit or delete the matching row in the Jobs sheet.");
                      return;
                    }
                    setVisitSubmitStatus("idle");
                    setVisitForm({
                      date: isoToDisplayDate(selectedVisitDate || getTodayIso()),
                      totalHours: "",
                      totalMaterials: "",
                      notesMaterials: "",
                    });
                    setActivePage("visitForm");
                  }}
                  className={`shrink-0 rounded-2xl border px-3 py-2 text-xs leading-tight transition-all duration-200 ${visitMarkedToday ? `${theme.accentButton} cursor-not-allowed border-transparent text-white` : `${theme.borderStrong} bg-white ${theme.softText} ${theme.hoverBg}`}`}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {visitMarkedToday ? "Visit submitted" : "Mark visit done today"}
                </Button>
              </div>

              {selectedClient.accessInfo && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 shadow-sm">
                  <span className="font-bold">Access:</span> <span className="whitespace-pre-line">{selectedClient.accessInfo}</span>
                </div>
              )}

              <div className={`rounded-2xl border ${theme.border} ${theme.accentBg} p-3`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${theme.strongText}`}>Client Notes</p>
                    <p className="text-xs text-slate-500">Long-term property instructions and client requests.</p>
                  </div>
                  <Button onClick={() => setActivePage("addNote")} className={`shrink-0 rounded-xl px-3 py-2 text-xs ${theme.accentButton}`}>
                    <Plus className="mr-1 h-4 w-4" /> Note
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedClient.activeNotes.length === 0 && <p className="rounded-2xl bg-white p-3 text-sm text-slate-500">Nothing pending for this client.</p>}
                  {selectedClient.activeNotes.map((note) => (
                    <NoteCard key={note.id} note={note} onOpenPhoto={() => setImageViewerUrl(note.photo)} onEdit={() => startEditNote(note)} onDone={() => completeNote(note.id)} onDelete={() => deleteNote(note.id)} theme={theme} />
                  ))}
                </div>
              </div>



              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-950">Job Alerts</p>
                    <p className="text-xs text-amber-800">Short-term reminders for tools, materials or things to bring.</p>
                  </div>
                  <Button onClick={() => setActivePage("addAlert")} className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-xs text-white hover:bg-amber-700">
                    <Plus className="mr-1 h-4 w-4" /> Alert
                  </Button>
                </div>
                <div className="space-y-2">
                  {(selectedClient.activeAlerts || []).length === 0 && <p className="rounded-2xl bg-white/70 p-3 text-sm text-amber-900">No active alerts for this client.</p>}
                  {(selectedClient.activeAlerts || []).map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
                      <p className="whitespace-pre-line text-sm leading-6">{alert.text}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div><p className="text-xs text-amber-800">Show on {formatDate(alert.alertDate || selectedClient.nextVisit || today)}</p><p className="text-[11px] text-amber-700">Added {daysAgo(alert.createdAt)}</p></div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditAlert(alert)} className="rounded-2xl border-amber-300 text-amber-800 hover:bg-amber-50"><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)} className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                          <Button size="sm" onClick={() => completeAlert(alert.id)} className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"><CheckCircle2 className="mr-1 h-4 w-4" /> Job Completed</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>



              <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                <p className="text-sm font-medium text-amber-950">Last visit</p>
                <p className="text-lg font-semibold">{selectedClient.visitHistory.length ? daysAgo(selectedClient.visitHistory[0]) : "Never recorded"}</p>
                {selectedClient.visitHistory.length > 0 && <p className="text-sm text-slate-500">{formatDate(selectedClient.visitHistory[0])}</p>}
              </div>

              
            </CardContent>
          </Card>
        )}

        {activePage === "addNote" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Client Notes" title={`Add note`} subtitle={selectedClient.name} theme={theme} />
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-semibold">New note</p>
                <textarea value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Example: Cut hedge back to the driveway line next visit." rows={5} className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 ${theme.focusRing}`} />
                {newPhoto && (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={newPhoto} alt="New note attachment preview" className="h-36 w-full object-cover" />
                    <button onClick={() => setNewPhoto(null)} className="w-full p-2 text-sm font-medium text-slate-600">Remove photo</button>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className={`flex cursor-pointer items-center justify-center rounded-2xl border ${theme.borderStrong} ${theme.accentBg} p-3 text-sm font-medium ${theme.softText}`}>
                    <Camera className="mr-2 h-4 w-4" /> Attach photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <Button onClick={() => { if (newNote.trim() || newPhoto) { addNote(); setActivePage("details"); } }} className={`rounded-2xl ${theme.accentButton}`}><Plus className="mr-2 h-4 w-4" /> ADD</Button>
                </div>
              </div>
              <BackButton onClick={() => setActivePage("details")} theme={theme}>Back to tasks</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "addAlert" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Job Alerts" title="Add alert" subtitle={selectedClient.name} theme={theme} />
              <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-amber-950">New alert</p>
                                <DateInput label="Show alert on" value={newAlertDate} onChange={setNewAlertDate} theme={theme} required />
<textarea value={newAlert} onChange={(event) => setNewAlert(event.target.value)} placeholder="Example: Take wheelbarrow, buy mulch, bring ladder..." rows={4} className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
                <Button onClick={() => { if (newAlert.trim()) { addAlert(); setActivePage("details"); } }} className="mt-3 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"><Plus className="mr-2 h-4 w-4" /> ADD</Button>
              </div>
              <BackButton onClick={() => setActivePage("details")} theme={theme}>Back to tasks</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "editNote" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Client Notes" title="Edit note" subtitle={selectedClient.name} theme={theme} />
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <textarea
                  value={editingNoteText}
                  onChange={(event) => setEditingNoteText(event.target.value)}
                  rows={5}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 ${theme.focusRing}`}
                />
                                {editingNotePhoto && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={editingNotePhoto} alt="Note attachment preview" className="h-36 w-full object-cover" />
                    <button onClick={() => setEditingNotePhoto(null)} className="w-full p-2 text-sm font-medium text-slate-600">Remove photo</button>
                  </div>
                )}
                <label className={`mt-3 flex cursor-pointer items-center justify-center rounded-2xl border ${theme.borderStrong} ${theme.accentBg} p-3 text-sm font-medium ${theme.softText}`}>
                  <Camera className="mr-2 h-4 w-4" /> Attach / change photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImageFile(file, { maxSize: 1600, quality: 0.75 });
                        setEditingNotePhoto(compressed);
                      } catch (error) {
                        console.error("Photo compression failed:", error);
                        alert("Could not prepare this photo. Please try another image.");
                      }
                    }}
                    className="hidden"
                  />
                </label>
<Button onClick={saveEditedNote} className={`mt-3 w-full rounded-2xl ${theme.accentButton}`}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Save note
                </Button>
              </div>
              <BackButton onClick={() => setActivePage("details")} theme={theme}>Back to tasks</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "editAlert" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Job Alerts" title="Edit alert" subtitle={selectedClient.name} theme={theme} />
              <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
                                <DateInput label="Show alert on" value={editingAlertDate} onChange={setEditingAlertDate} theme={theme} required />
<textarea
                  value={editingAlertText}
                  onChange={(event) => setEditingAlertText(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
                <Button onClick={saveEditedAlert} className="mt-3 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Save alert
                </Button>
              </div>
              <BackButton onClick={() => setActivePage("details")} theme={theme}>Back to tasks</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "visitForm" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Visit form" title={selectedClient.name} theme={theme} />
              <DateInput label="Date" value={visitForm.date} onChange={(value) => setVisitForm({ ...visitForm, date: value })} theme={theme} required />
              <TextInput label="Total hours" value={visitForm.totalHours} onChange={(value) => setVisitForm({ ...visitForm, totalHours: value })} theme={theme} required />
              <TextInput label="Total materials" value={visitForm.totalMaterials} onChange={(value) => setVisitForm({ ...visitForm, totalMaterials: value })} theme={theme} required placeholder="If none, type 0" />
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Notes / Materials Used</span>
                <textarea value={visitForm.notesMaterials} onChange={(event) => setVisitForm({ ...visitForm, notesMaterials: event.target.value })} rows={4} className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme.focusRing}`} />
              </label>
              {visitFormError && <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-100">{visitFormError}</p>}
              <Button
                onClick={async () => {
                  const visitDate = displayToIsoDate(visitForm.date) || selectedVisitDate || today;

                  if (selectedClient.completedDates?.includes(visitDate)) {
                    setVisitFormError("This visit has already been submitted. To fix a mistake, edit or delete the matching row in the Jobs sheet.");
                    setVisitSubmitStatus("error");
                    return;
                  }

                  setVisitSubmitStatus("sending");

                  const visitId = generateRecordId("VISIT");
                  const visitData = {
                    action: "saveJob",
                    visitId,
                    clientId: selectedClient.clientId || selectedClient.id,
                    client: selectedClient.name,
                    date: visitForm.date,
                    totalHours: visitForm.totalHours,
                    totalMaterials: visitForm.totalMaterials,
                    notesMaterials: visitForm.notesMaterials,
                  };

                  let success = await submitVisitToSheets(visitData);
                  if (!success) {
                    success = submitVisitToSheetsFallback(visitData);
                  }

                  if (success) {
                    setVisitSubmitStatus("sent");
                    submitVisitForm();
                  } else {
                    setVisitSubmitStatus("error");
                  }
                }}
                className={`w-full rounded-2xl ${
                  visitSubmitStatus === "sent"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : visitSubmitStatus === "sending"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : visitSubmitStatus === "error"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : theme.accentButton
                }`}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {visitSubmitStatus === "sent"
                  ? "Visit sent"
                  : visitSubmitStatus === "sending"
                  ? "Sending..."
                  : visitSubmitStatus === "error"
                  ? "Check visit details"
                  : "Submit visit and mark done"}
              </Button>
              {visitSubmitStatus === "sent" && (
                <p className="rounded-2xl bg-green-50 p-3 text-sm font-medium text-green-800 ring-1 ring-green-100">
                  Visit sent to Google Sheets. Check the Jobs sheet.
                </p>
              )}
              <BackButton onClick={() => setActivePage("details")} theme={theme}>Back to client tasks</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "history" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or suburb" className={`w-full rounded-2xl border ${theme.border} bg-white py-3 pl-10 pr-3 outline-none focus:ring-2 ${theme.focusRing}`} />
            </div>
            {sortedByLastDone.map((client) => <HistoryClientButton key={client.id} client={client} theme={theme} onClick={() => { setSelectedClientId(client.id); setActivePage("clientHistory"); }} />)}
          </div>
        )}

        {activePage === "clientHistory" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Completed history" title={selectedClient.name} subtitle={selectedClient.suburb} theme={theme} />
              <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                <p className="text-sm font-medium text-amber-950">Last visit</p>
                <p className="text-lg font-semibold">{selectedClient.visitHistory.length ? daysAgo(selectedClient.visitHistory[0]) : "Never recorded"}</p>
                {selectedClient.visitHistory.length > 0 && <p className="text-sm text-slate-500">{formatDate(selectedClient.visitHistory[0])}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Completed notes / reminders</p>
                {selectedClient.completedNotes.length === 0 && <p className="rounded-2xl border bg-white p-3 text-sm text-slate-500">No completed notes yet.</p>}
                {selectedClient.completedNotes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {note.photo && <button type="button" onClick={() => setImageViewerUrl(note.photo)} className="mb-3 block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left"><img src={note.photo} alt="Completed note attachment" className="h-36 w-full object-cover" /><div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600"><ImageIcon className="h-4 w-4" /> Tap to open photo</div></button>}
                    <p className="whitespace-pre-line text-sm leading-6">{note.text}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">Completed {daysAgo(note.completedAt)} · {formatDate(note.completedAt)}</p>
                      <Button size="sm" variant="outline" onClick={() => restoreCompletedNote(note.id)} className={`rounded-2xl ${theme.borderStrong} ${theme.softText} ${theme.hoverBg}`}>Return to tasks</Button>
                    </div>
                  </div>
                ))}
              </div>
              <BackButton onClick={() => setActivePage("history")} theme={theme}>Back to all clients</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "settings" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-3 p-4">
              <PageTitle eyebrow="Settings" title="Main Settings" theme={theme} />
              <SettingsMenuItem icon={<Users className="h-5 w-5" />} title="Clients" description="Create or edit client details." onClick={() => setActivePage("settingsClientsMenu")} theme={theme} />
              <SettingsMenuItem icon={<CalendarDays className="h-5 w-5" />} title="Jobs / Schedule" description="Set frequency, weekday or one-off dates." onClick={() => setActivePage("settingsJobsSchedule")} theme={theme} />
              <SettingsMenuItem icon={<Palette className="h-5 w-5" />} title="Theme" description="Change the app colour scheme." onClick={() => setActivePage("settingsTheme")} theme={theme} />
            </CardContent>
          </Card>
        )}

        {activePage === "settingsJobsSchedule" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Settings" title="Jobs / Schedule" subtitle="Manage recurring schedule and extra one-off jobs separately." theme={theme} />
              <SelectInput label="Select client" value={String(selectedClientId)} onChange={(value) => { setClientEditStatus("idle"); setSelectedClientId(Number(value)); }} options={clients.map((client) => ({ label: client.name, value: String(client.id) }))} />

              {!selectedClient.frequency && (
                <div className="rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
                  This client has no recurring schedule yet. Use Update recurring schedule below, or add a one-off job.
                </div>
              )}

              <div className={`rounded-2xl ${theme.accentBg} p-3 text-sm ${theme.strongText} ring-1 ${theme.border}`}>
                Recurring schedule and one-off jobs are separate. Adding a one-off job will not replace the recurring schedule.
              </div>

              <div className={`rounded-2xl border ${theme.border} bg-white p-3 shadow-sm`}>
                <p className={`mb-2 text-sm font-semibold ${theme.strongText}`}>Recurring schedule</p>
                <SelectInput label="Frequency" value={selectedClient.frequency || "Weekly"} onChange={updateSelectedFrequency} options={["Weekly", "Fortnightly", "Every 3 weeks", "Monthly"]} />
                <SelectInput label="Day" value={selectedClient.scheduleDay || "Monday"} onChange={(value) => updateSelectedClient("scheduleDay", value)} options={weekdays} />
                <Button onClick={createJobForSelectedClient} className={`mt-3 w-full rounded-2xl ${theme.accentButton}`}>{selectedClient.frequency ? "Update recurring schedule" : "Create recurring schedule"}</Button>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-amber-950">One-off jobs</p>
                <DateInput label="One-off job date" value={oneOffJobDate} onChange={setOneOffJobDate} theme={theme} required />
                <Button onClick={addOneOffJobForSelectedClient} className="mt-3 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700">Add one-off job</Button>

                <div className="mt-3 space-y-2">
                  {(selectedClient.oneOffJobs || []).length === 0 && (
                    <p className="rounded-xl bg-white/70 p-2 text-sm text-amber-800">No one-off jobs for this client.</p>
                  )}
                  {(selectedClient.oneOffJobs || []).map((job) => (
                    <div key={job.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 text-sm text-amber-950">
                      <span>{formatDate(job.date)}</span>
                      <Button size="sm" variant="outline" onClick={() => deleteOneOffJob(selectedClient.id, job.id)} className="rounded-xl border-red-200 text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={deleteJobForSelectedClient} variant="outline" className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50">
                  <Trash2 className="mr-1 h-4 w-4" /> Delete recurring
                </Button>
                <Button onClick={() => deleteClient(selectedClient.id)} variant="outline" className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50">
                  <Trash2 className="mr-1 h-4 w-4" /> Delete client
                </Button>
              </div>

              <BackButton onClick={() => setActivePage("settings")} theme={theme}>Back to settings</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "settingsTheme" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Settings" title="Theme" theme={theme} />
              <div className="grid gap-3">
                {Object.entries(colourSchemes).map(([key, scheme]) => (
                  <button key={key} onClick={() => chooseColourScheme(key)} className={`rounded-2xl border p-4 text-left transition ${colourScheme === key ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${scheme.header}`} />
                        <div><p className="font-semibold">{scheme.name}</p><p className="text-sm text-slate-500">Tap to use this colour scheme</p></div>
                      </div>
                      {colourScheme === key && <CheckCircle2 className="h-5 w-5 text-slate-900" />}
                    </div>
                  </button>
                ))}
              </div>
              <BackButton onClick={() => setActivePage("settings")} theme={theme}>Back to settings</BackButton>
            </CardContent>
          </Card>
        )}
        {activePage === "settingsClientsMenu" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-3 p-4">
              <PageTitle eyebrow="Settings" title="Clients" theme={theme} />
              <SettingsMenuItem icon={<Plus className="h-5 w-5" />} title="Create new client" description="Add a new fixed or one-off client." onClick={() => { setClientSubmitStatus("idle"); setActivePage("settingsClientsCreate"); }} theme={theme} />
              <SettingsMenuItem icon={<CalendarDays className="h-5 w-5" />} title="Edit client" description="Change client name, suburb and address." onClick={() => { setClientEditStatus("idle"); setActivePage("settingsClientsEdit"); }} theme={theme} />
              <BackButton onClick={() => setActivePage("settings")} theme={theme}>Back to settings</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "settingsClientsCreate" && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Clients" title="Create new client" subtitle="This will also send the client to the Clients sheet." theme={theme} />
              <TextInput label="Nickname" value={newClientForm.name} onChange={(value) => setNewClientForm({ ...newClientForm, name: value })} theme={theme} required />
              <TextInput label="Client Name (invoice)" value={newClientForm.invoiceName} onChange={(value) => setNewClientForm({ ...newClientForm, invoiceName: value })} theme={theme} placeholder="Full name or business name" required />
              <TextInput label="Suburb" value={newClientForm.suburb} onChange={(value) => setNewClientForm({ ...newClientForm, suburb: value })} theme={theme} />
              <AddressInput label="Address" value={newClientForm.address} onChange={(value) => setNewClientForm({ ...newClientForm, address: value })} theme={theme} />
              <TextInput label="Phone" value={newClientForm.phone} onChange={(value) => setNewClientForm({ ...newClientForm, phone: value })} theme={theme} />
              <TextInput label="Email" value={newClientForm.email} onChange={(value) => setNewClientForm({ ...newClientForm, email: value })} theme={theme} />
              <div className={`rounded-2xl border ${theme.border} ${theme.accentBg} p-3`}>
                <p className={`mb-2 text-sm font-semibold ${theme.strongText}`}>Access Info</p>
                <textarea
                  value={newClientForm.accessInfo}
                  onChange={(event) => setNewClientForm({ ...newClientForm, accessInfo: event.target.value })}
                  placeholder="Gate codes, parking instructions, key location, entry notes..."
                  rows={4}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
              <div className={`rounded-2xl ${theme.accentBg} p-3 text-sm ${theme.strongText} ring-1 ${theme.border}`}>Client schedule is set separately in Settings &gt; Jobs / Schedule.</div>
              <Button
                onClick={createNewClientFromSettings}
                className={`w-full rounded-2xl ${
                  clientSubmitStatus === "sent"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : clientSubmitStatus === "sending"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : clientSubmitStatus === "error"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : theme.accentButton
                }`}
              >
                {clientSubmitStatus === "sent"
                  ? "Client saved"
                  : clientSubmitStatus === "sending"
                  ? "Saving..."
                  : clientSubmitStatus === "error"
                  ? "Try again"
                  : "Create client"}
              </Button>
              {clientSubmitStatus === "sent" && (
                <p className="rounded-2xl bg-green-50 p-3 text-sm font-medium text-green-800 ring-1 ring-green-100">
                  Client sent to the Clients sheet.
                </p>
              )}
              <BackButton onClick={() => setActivePage("settingsClientsMenu")} theme={theme}>Back to clients</BackButton>
            </CardContent>
          </Card>
        )}

        {activePage === "settingsClientsEdit" && selectedClient && (
          <Card className={`rounded-3xl ${theme.border} bg-white shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              <PageTitle eyebrow="Clients" title="Edit client / schedule" theme={theme} />
              <SelectInput label="Select client" value={String(selectedClientId)} onChange={(value) => setSelectedClientId(Number(value))} options={clients.map((client) => ({ label: client.name, value: String(client.id) }))} />
              <TextInput label="Nickname" value={selectedClient.name} onChange={(value) => updateSelectedClient("name", value)} theme={theme} />
              <TextInput label="Client Name (invoice)" value={selectedClient.invoiceName || selectedClient.name} onChange={(value) => updateSelectedClient("invoiceName", value)} theme={theme} placeholder="Full name or business name" />
              <TextInput label="Suburb" value={selectedClient.suburb} onChange={(value) => updateSelectedClient("suburb", value)} theme={theme} />
              <AddressInput label="Address" value={selectedClient.address || ""} onChange={(value) => updateSelectedClient("address", value)} theme={theme} />
              <TextInput label="Phone" value={selectedClient.phone || ""} onChange={(value) => updateSelectedClient("phone", value)} theme={theme} />
              <TextInput label="Email" value={selectedClient.email || ""} onChange={(value) => updateSelectedClient("email", value)} theme={theme} />
              <div className={`rounded-2xl border ${theme.border} ${theme.accentBg} p-3`}>
                <p className={`mb-2 text-sm font-semibold ${theme.strongText}`}>Access Info</p>
                <textarea
                  value={selectedClient.accessInfo || ""}
                  onChange={(event) => updateSelectedClient("accessInfo", event.target.value)}
                  placeholder="Gate codes, parking instructions, key location, entry notes..."
                  rows={4}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
              <div className={`rounded-2xl ${theme.accentBg} p-3 text-sm ${theme.strongText} ring-1 ${theme.border}`}>Client schedule is managed separately in Settings &gt; Jobs / Schedule.</div>
              <Button
                onClick={saveEditedClientToSheets}
                className={`w-full rounded-2xl ${
                  clientEditStatus === "saved"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : clientEditStatus === "saving"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : clientEditStatus === "error"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : theme.accentButton
                }`}
              >
                {clientEditStatus === "saved"
                  ? "Changes saved"
                  : clientEditStatus === "saving"
                  ? "Saving..."
                  : clientEditStatus === "error"
                  ? "Try again"
                  : "Save changes"}
              </Button>
              {clientEditStatus === "saved" && (
                <p className="rounded-2xl bg-green-50 p-3 text-sm font-medium text-green-800 ring-1 ring-green-100">
                  Client updated in the Clients sheet.
                </p>
              )}
              <Button onClick={() => deleteClient(selectedClient.id)} variant="outline" className="w-full rounded-2xl border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Delete client</Button>
              <BackButton onClick={() => setActivePage("settingsClientsMenu")} theme={theme}>Back to clients</BackButton>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ClientScheduleButton({ client, date, jobType = "recurring", theme, onClick, onDragStart }) {
  const completed = client.completedDates?.includes(date);
  const activeNoteCount = client.activeNotes?.length || 0;
  const isOneOff = jobType === "one-off";

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`w-full rounded-3xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        completed ? "border-green-200 bg-green-50" : isOneOff ? "border-amber-200 bg-amber-50" : `${theme.border} bg-white`
      }`}
    >
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0">
          <p className={`truncate text-base font-semibold ${completed ? "text-green-800 line-through" : isOneOff ? "text-amber-950" : theme.strongText}`}>
            {client.name || client.invoiceName || "Client"}
          </p>

          <p className={`mt-0.5 truncate text-sm ${completed ? "text-green-700" : isOneOff ? "font-medium text-amber-800" : "text-slate-500"}`}>
            {client.suburb || "Suburb"} · {isOneOff ? "One-off" : client.frequency || "No job scheduled"}
          </p>

          {activeNoteCount > 0 && !completed && (
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${isOneOff ? "text-amber-800" : theme.accentText}`}>
              <Bell className="h-4 w-4" />
              {activeNoteCount} active note{activeNoteCount === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {client.address && (
            <a
              href={googleMapsUrl(client.address)}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-2xl ${
                completed ? "bg-green-100 text-green-800" : isOneOff ? "bg-amber-100 text-amber-900" : `${theme.softBg} ${theme.softText}`
              } px-3 py-2 text-sm font-semibold shadow-sm`}
              aria-label={`Open ${client.name || "client"} address in Maps`}
            >
              <MapPin className="h-5 w-5" />
              Maps
            </a>
          )}

          {completed && (
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </div>
          )}
        </div>
      </div>
    </button>
  );
}


function HistoryClientButton({ client, theme, onClick }) {
  const lastVisit = client.visitHistory[0];
  return (
    <button onClick={onClick} className={`w-full rounded-3xl border ${theme.border} bg-white p-4 text-left shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{client.name}</p>
          <p className="text-sm text-slate-500">{client.suburb}</p>
          <p className="mt-2 text-sm text-slate-500">{client.frequency}</p>
          <p className={`mt-1 text-xs ${theme.accentText}`}>{client.completedNotes.length} completed note{client.completedNotes.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3 text-right ring-1 ring-amber-100">
          <p className="text-xs text-amber-900">Last done</p>
          <p className="font-bold">{lastVisit ? daysAgo(lastVisit) : "Never"}</p>
          {lastVisit && <p className="text-xs text-slate-500">{formatDate(lastVisit)}</p>}
        </div>
      </div>
    </button>
  );
}

function NoteCard({ note, onOpenPhoto, onEdit, onDone, onDelete, theme }) {
  return (
    <div className={`rounded-2xl border ${theme.border} bg-white p-3 shadow-sm`}>
      {note.photo && (
        <button type="button" onClick={onOpenPhoto} className="mb-3 block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left">
          <img src={note.photo} alt="Note attachment" className="h-36 w-full object-cover" />
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600"><ImageIcon className="h-4 w-4" /> Tap to open photo</div>
        </button>
      )}
      <p className="whitespace-pre-line text-sm leading-6">{note.text}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Added {daysAgo(note.createdAt)}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className={`rounded-2xl ${theme.borderStrong} ${theme.softText} ${theme.hoverBg}`}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
          <Button size="sm" onClick={onDone} className={`rounded-2xl ${theme.accentButton}`}><CheckCircle2 className="mr-1 h-4 w-4" /> Job Completed</Button>
        </div>
      </div>
    </div>
  );
}

function SettingsMenuItem({ icon, title, description, onClick, theme }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl ${theme.accentBg} p-3`}>{icon}</div>
        <div><p className="font-semibold">{title}</p><p className="text-sm text-slate-500">{description}</p></div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function PageTitle({ eyebrow, title, subtitle, theme }) {
  return (
    <div>
      <p className={`text-sm ${theme.accentText}`}>{eyebrow}</p>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function BackButton({ children, onClick, theme }) {
  return (
    <Button onClick={onClick} variant="outline" className={`w-full rounded-2xl ${theme.borderStrong} bg-white ${theme.softText} ${theme.hoverBg}`}>{children}</Button>
  );
}

function TabButton({ active, onClick, icon, label, theme }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center rounded-2xl p-3 text-xs font-medium transition ${active ? theme.activeTab : theme.inactiveTab}`}>
      {React.cloneElement(icon, { className: "mb-1 h-4 w-4" })}
      {label}
    </button>
  );
}

function AddressInput({ label, value, onChange, theme, required = false }) {
  const mapsPreviewUrl = value ? googleMapsUrl(value) : "";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input
        list="address-suggestions"
        placeholder="Start typing address or suburb..."
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme?.focusRing || "focus:ring-slate-300"}`}
      />
      <datalist id="address-suggestions">
        {addressSuggestions.map((address) => (
          <option key={address} value={address} />
        ))}
      </datalist>
      {value && (
        <a
          href={mapsPreviewUrl}
          target="_blank"
          rel="noreferrer"
          className={`mt-2 inline-flex rounded-full ${theme?.softBg || "bg-slate-100"} px-3 py-1 text-xs font-medium ${theme?.softText || "text-slate-800"}`}
        >
          <MapPin className="mr-1 h-3 w-3" /> Check in Maps
        </a>
      )}
    </label>
  );
}

function TextInput({ label, value, onChange, theme, required = false, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input placeholder={placeholder} value={value} required={required} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme?.focusRing || "focus:ring-slate-300"}`} />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange, theme, required = false }) {
  const isoValue = displayToIsoDate(value);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input type="date" value={isoValue} required={required} onChange={(event) => onChange(isoToDisplayDate(event.target.value))} className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 ${theme?.focusRing || "focus:ring-slate-300"}`} aria-label="Open calendar" />
    </label>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
      stack: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
      stack: error?.stack || "",
    };
  }

  componentDidCatch(error, info) {
    console.error("Gardening Scheduler Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
          <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-red-700">App error detected</h1>

            <p className="mt-2 text-sm text-slate-600">
              Instead of a blank page, the app is showing the error details below.
            </p>

            <div className="mt-4 rounded-2xl bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">
                {this.state.errorMessage}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Reload app
            </button>

            <details className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold">Technical details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {this.state.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <InnerApp />
    </AppErrorBoundary>
  );
}