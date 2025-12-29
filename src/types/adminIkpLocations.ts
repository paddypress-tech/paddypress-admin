import { z } from "zod";

export const AdminIkpStateSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminIkpState = z.infer<typeof AdminIkpStateSchema>;

export const AdminIkpDistrictSchema = z.object({
  id: z.string(),
  stateId: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminIkpDistrict = z.infer<typeof AdminIkpDistrictSchema>;

export const AdminIkpMandalSchema = z.object({
  id: z.string(),
  districtId: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminIkpMandal = z.infer<typeof AdminIkpMandalSchema>;

export const AdminIkpVillageSchema = z.object({
  id: z.string(),
  mandalId: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminIkpVillage = z.infer<typeof AdminIkpVillageSchema>;

export const PagedAdminResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    }),
    message: z.string().optional(),
  });

export const AdminIkpStatesListResponseSchema = PagedAdminResponseSchema(AdminIkpStateSchema);
export type AdminIkpStatesListResponse = z.infer<typeof AdminIkpStatesListResponseSchema>;

export const AdminIkpDistrictsListResponseSchema = PagedAdminResponseSchema(AdminIkpDistrictSchema);
export type AdminIkpDistrictsListResponse = z.infer<typeof AdminIkpDistrictsListResponseSchema>;

export const AdminIkpMandalsListResponseSchema = PagedAdminResponseSchema(AdminIkpMandalSchema);
export type AdminIkpMandalsListResponse = z.infer<typeof AdminIkpMandalsListResponseSchema>;

export const AdminIkpVillagesListResponseSchema = PagedAdminResponseSchema(AdminIkpVillageSchema);
export type AdminIkpVillagesListResponse = z.infer<typeof AdminIkpVillagesListResponseSchema>;

export const AdminIkpStateResponseSchema = z.object({
  success: z.boolean(),
  data: AdminIkpStateSchema,
  message: z.string().optional(),
});

export type AdminIkpStateResponse = z.infer<typeof AdminIkpStateResponseSchema>;

export const AdminIkpDistrictResponseSchema = z.object({
  success: z.boolean(),
  data: AdminIkpDistrictSchema,
  message: z.string().optional(),
});

export type AdminIkpDistrictResponse = z.infer<typeof AdminIkpDistrictResponseSchema>;

export const AdminIkpMandalResponseSchema = z.object({
  success: z.boolean(),
  data: AdminIkpMandalSchema,
  message: z.string().optional(),
});

export type AdminIkpMandalResponse = z.infer<typeof AdminIkpMandalResponseSchema>;

export const AdminIkpVillageResponseSchema = z.object({
  success: z.boolean(),
  data: AdminIkpVillageSchema,
  message: z.string().optional(),
});

export type AdminIkpVillageResponse = z.infer<typeof AdminIkpVillageResponseSchema>;

export const CreateAdminIkpStateRequestSchema = z.object({
  code: z.string().min(1, "Enter a state code."),
  name: z.string().min(1, "Enter a state name."),
  isActive: z.boolean().optional(),
});

export type CreateAdminIkpStateRequest = z.infer<typeof CreateAdminIkpStateRequestSchema>;

export const UpdateAdminIkpStateRequestSchema = CreateAdminIkpStateRequestSchema.partial();
export type UpdateAdminIkpStateRequest = z.infer<typeof UpdateAdminIkpStateRequestSchema>;

export const CreateAdminIkpDistrictRequestSchema = z.object({
  stateId: z.string().min(1, "Select a state."),
  name: z.string().min(1, "Enter a district name."),
  isActive: z.boolean().optional(),
});

export type CreateAdminIkpDistrictRequest = z.infer<typeof CreateAdminIkpDistrictRequestSchema>;

export const UpdateAdminIkpDistrictRequestSchema = z
  .object({
    name: z.string().min(1, "Enter a district name.").optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export type UpdateAdminIkpDistrictRequest = z.infer<typeof UpdateAdminIkpDistrictRequestSchema>;

export const CreateAdminIkpMandalRequestSchema = z.object({
  districtId: z.string().min(1, "Select a district."),
  name: z.string().min(1, "Enter a mandal name."),
  isActive: z.boolean().optional(),
});

export type CreateAdminIkpMandalRequest = z.infer<typeof CreateAdminIkpMandalRequestSchema>;

export const UpdateAdminIkpMandalRequestSchema = z
  .object({
    name: z.string().min(1, "Enter a mandal name.").optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export type UpdateAdminIkpMandalRequest = z.infer<typeof UpdateAdminIkpMandalRequestSchema>;

export const CreateAdminIkpVillageRequestSchema = z.object({
  mandalId: z.string().min(1, "Select a mandal."),
  name: z.string().min(1, "Enter a village name."),
  isActive: z.boolean().optional(),
});

export type CreateAdminIkpVillageRequest = z.infer<typeof CreateAdminIkpVillageRequestSchema>;

export const UpdateAdminIkpVillageRequestSchema = z
  .object({
    name: z.string().min(1, "Enter a village name.").optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export type UpdateAdminIkpVillageRequest = z.infer<typeof UpdateAdminIkpVillageRequestSchema>;
