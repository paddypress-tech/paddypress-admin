import { z } from "zod";

export const AdminIkpCenterSchema = z.object({
  id: z.string(),
  stateId: z.string(),
  districtId: z.string(),
  mandalId: z.string(),
  villageId: z.string(),
  state: z.string(),
  district: z.string(),
  mandal: z.string(),
  village: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminIkpCenter = z.infer<typeof AdminIkpCenterSchema>;

export const AdminIkpCentersListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(AdminIkpCenterSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
  message: z.string().optional(),
});

export type AdminIkpCentersListResponse = z.infer<typeof AdminIkpCentersListResponseSchema>;

export const AdminIkpCenterResponseSchema = z.object({
  success: z.boolean(),
  data: AdminIkpCenterSchema,
  message: z.string().optional(),
});

export type AdminIkpCenterResponse = z.infer<typeof AdminIkpCenterResponseSchema>;

export const AdminIkpCenterLocationsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(z.string()),
  }),
  message: z.string().optional(),
});

export type AdminIkpCenterLocationsResponse = z.infer<typeof AdminIkpCenterLocationsResponseSchema>;

export const CreateAdminIkpCenterRequestSchema = z.object({
  villageId: z.string().min(1, "Select a village."),
  name: z.string().min(1, "Enter an IKP center name."),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAdminIkpCenterRequest = z.infer<typeof CreateAdminIkpCenterRequestSchema>;

export const UpdateAdminIkpCenterRequestSchema = CreateAdminIkpCenterRequestSchema.partial();

export type UpdateAdminIkpCenterRequest = z.infer<typeof UpdateAdminIkpCenterRequestSchema>;
