// frontend/lib/api.ts
// Centralised API client — all fetch calls to the Go backend go through here.
// Changing the base URL in one place updates the entire app.

const API_BASE = ""; // Relative path to handled by Netlify proxy

// Generic fetcher with error handling
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    // Try to parse the error message from the Go API's JSON error response
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// --- Type Definitions ---------------------------------------------------------

export interface Crime {
  crime_id: number;
  crime_type: string;
  occurrence_timestamp: string;
  description: string;
  location_id: number;
  area_name: string;
  risk_level: number;
}

export interface Offender {
  offender_id: number;
  name: string;
  age: number;
  address: string;
  previous_crimes_count: number;
  linked_crimes_count: number;
}

export interface Hotspot {
  location_id: number;
  area_name: string;
  city: string;
  risk_level: number;
  latitude: number;
  longitude: number;
  crime_count: number;
}

export interface Location {
  location_id: number;
  area_name: string;
  city: string;
  zone: string;
  risk_level: number;
  latitude: number;
  longitude: number;
}

export interface NewFIRPayload {
  crime_id: number;
  officer_id: number;
  status: "Open" | "Closed" | "Under Investigation";
}

export interface FIRResponse {
  message: string;
  fir_id: number;
}

// --- API Functions ------------------------------------------------------------

export const getCrimes = (type?: string) =>
  apiFetch<Crime[]>(`/api/crimes${type ? `?type=${encodeURIComponent(type)}` : ""}`);

export const getOffenders = () => apiFetch<Offender[]>("/api/offenders");

export const getHotspots = () => apiFetch<Hotspot[]>("/api/hotspots");

export const getLocations = () => apiFetch<Location[]>("/api/locations");

export const createFIR = (payload: NewFIRPayload) =>
  apiFetch<FIRResponse>("/api/fir", {
    method: "POST",
    body: JSON.stringify(payload),
  });
