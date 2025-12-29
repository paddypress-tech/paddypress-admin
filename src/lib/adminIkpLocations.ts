import { apiFetch } from "./api";
import {
  AdminIkpDistrictResponseSchema,
  AdminIkpDistrictsListResponseSchema,
  AdminIkpMandalResponseSchema,
  AdminIkpMandalsListResponseSchema,
  AdminIkpStateResponseSchema,
  AdminIkpStatesListResponseSchema,
  AdminIkpVillageResponseSchema,
  AdminIkpVillagesListResponseSchema,
  CreateAdminIkpDistrictRequestSchema,
  CreateAdminIkpMandalRequestSchema,
  CreateAdminIkpStateRequestSchema,
  CreateAdminIkpVillageRequestSchema,
  UpdateAdminIkpDistrictRequestSchema,
  UpdateAdminIkpMandalRequestSchema,
  UpdateAdminIkpStateRequestSchema,
  UpdateAdminIkpVillageRequestSchema,
  type CreateAdminIkpDistrictRequest,
  type CreateAdminIkpMandalRequest,
  type CreateAdminIkpStateRequest,
  type CreateAdminIkpVillageRequest,
  type UpdateAdminIkpDistrictRequest,
  type UpdateAdminIkpMandalRequest,
  type UpdateAdminIkpStateRequest,
  type UpdateAdminIkpVillageRequest,
} from "../types/adminIkpLocations";

export async function listAdminIkpStates(params: {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
} = {}) {
  const qs = new URLSearchParams();
  if (typeof params.page === "number") qs.set("page", String(params.page));
  if (typeof params.limit === "number") qs.set("limit", String(params.limit));
  if (params.search && params.search.trim() !== "") qs.set("search", params.search.trim());
  if (typeof params.includeInactive === "boolean") qs.set("includeInactive", String(params.includeInactive));

  const res = await apiFetch(`/admin/ikp-states${qs.toString() ? `?${qs}` : ""}`);
  const parsed = AdminIkpStatesListResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function createAdminIkpState(payload: CreateAdminIkpStateRequest) {
  const validated = CreateAdminIkpStateRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the state details and try again.");

  const res = await apiFetch("/admin/ikp-states", {
    method: "POST",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpStateResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function updateAdminIkpState(id: string, payload: UpdateAdminIkpStateRequest) {
  const validated = UpdateAdminIkpStateRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the state details and try again.");

  const res = await apiFetch(`/admin/ikp-states/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpStateResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function deactivateAdminIkpState(id: string) {
  const res = await apiFetch(`/admin/ikp-states/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const parsed = AdminIkpStateResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function listAdminIkpDistricts(params: {
  page?: number;
  limit?: number;
  search?: string;
  stateId?: string;
  includeInactive?: boolean;
} = {}) {
  const qs = new URLSearchParams();
  if (typeof params.page === "number") qs.set("page", String(params.page));
  if (typeof params.limit === "number") qs.set("limit", String(params.limit));
  if (params.search && params.search.trim() !== "") qs.set("search", params.search.trim());
  if (params.stateId && params.stateId.trim() !== "") qs.set("stateId", params.stateId.trim());
  if (typeof params.includeInactive === "boolean") qs.set("includeInactive", String(params.includeInactive));

  const res = await apiFetch(`/admin/ikp-districts${qs.toString() ? `?${qs}` : ""}`);
  const parsed = AdminIkpDistrictsListResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function createAdminIkpDistrict(payload: CreateAdminIkpDistrictRequest) {
  const validated = CreateAdminIkpDistrictRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the district details and try again.");

  const res = await apiFetch("/admin/ikp-districts", {
    method: "POST",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpDistrictResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function updateAdminIkpDistrict(id: string, payload: UpdateAdminIkpDistrictRequest) {
  const validated = UpdateAdminIkpDistrictRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the district details and try again.");

  const res = await apiFetch(`/admin/ikp-districts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpDistrictResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function deactivateAdminIkpDistrict(id: string) {
  const res = await apiFetch(`/admin/ikp-districts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const parsed = AdminIkpDistrictResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function listAdminIkpMandals(params: {
  page?: number;
  limit?: number;
  search?: string;
  districtId?: string;
  includeInactive?: boolean;
} = {}) {
  const qs = new URLSearchParams();
  if (typeof params.page === "number") qs.set("page", String(params.page));
  if (typeof params.limit === "number") qs.set("limit", String(params.limit));
  if (params.search && params.search.trim() !== "") qs.set("search", params.search.trim());
  if (params.districtId && params.districtId.trim() !== "") qs.set("districtId", params.districtId.trim());
  if (typeof params.includeInactive === "boolean") qs.set("includeInactive", String(params.includeInactive));

  const res = await apiFetch(`/admin/ikp-mandals${qs.toString() ? `?${qs}` : ""}`);
  const parsed = AdminIkpMandalsListResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function createAdminIkpMandal(payload: CreateAdminIkpMandalRequest) {
  const validated = CreateAdminIkpMandalRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the mandal details and try again.");

  const res = await apiFetch("/admin/ikp-mandals", {
    method: "POST",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpMandalResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function listAdminIkpVillages(params: {
  page?: number;
  limit?: number;
  search?: string;
  mandalId?: string;
  includeInactive?: boolean;
} = {}) {
  const qs = new URLSearchParams();
  if (typeof params.page === "number") qs.set("page", String(params.page));
  if (typeof params.limit === "number") qs.set("limit", String(params.limit));
  if (params.search && params.search.trim() !== "") qs.set("search", params.search.trim());
  if (params.mandalId && params.mandalId.trim() !== "") qs.set("mandalId", params.mandalId.trim());
  if (typeof params.includeInactive === "boolean") qs.set("includeInactive", String(params.includeInactive));

  const res = await apiFetch(`/admin/ikp-villages${qs.toString() ? `?${qs}` : ""}`);
  const parsed = AdminIkpVillagesListResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function createAdminIkpVillage(payload: CreateAdminIkpVillageRequest) {
  const validated = CreateAdminIkpVillageRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the village details and try again.");

  const res = await apiFetch("/admin/ikp-villages", {
    method: "POST",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpVillageResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function updateAdminIkpVillage(id: string, payload: UpdateAdminIkpVillageRequest) {
  const validated = UpdateAdminIkpVillageRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the village details and try again.");

  const res = await apiFetch(`/admin/ikp-villages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpVillageResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function deactivateAdminIkpVillage(id: string) {
  const res = await apiFetch(`/admin/ikp-villages/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const parsed = AdminIkpVillageResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function updateAdminIkpMandal(id: string, payload: UpdateAdminIkpMandalRequest) {
  const validated = UpdateAdminIkpMandalRequestSchema.safeParse(payload);
  if (!validated.success) throw new Error("Check the mandal details and try again.");

  const res = await apiFetch(`/admin/ikp-mandals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(validated.data),
  });

  const parsed = AdminIkpMandalResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}

export async function deactivateAdminIkpMandal(id: string) {
  const res = await apiFetch(`/admin/ikp-mandals/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const parsed = AdminIkpMandalResponseSchema.safeParse(res);
  if (!parsed.success) throw new Error("Unexpected response from server.");
  return parsed.data;
}
