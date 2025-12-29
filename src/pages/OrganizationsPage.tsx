import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, CopyIcon, MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  createAdminOrganization,
  deleteAdminOrganization,
  listAdminOrganizations,
  updateAdminOrganization,
} from "@/lib/adminOrganizations";
import {
  createMillerUser,
  deactivateAdminUser,
  getAdminUserTemporaryPassword,
  updateAdminUser,
} from "@/lib/adminUsers";
import {
  type AdminOrganization,
  type AdminOrgUser,
  type AdminRole,
  AdminRoleSchema,
} from "@/types/adminOrganizations";

const EDIT_USER_ROLES: Array<{ value: AdminRole; label: string }> = [
  { value: "MILLER", label: "Miller" },
  { value: "MANAGER", label: "Manager" },
  { value: "DRIVER", label: "Driver" },
];

function TempPasswordCopyButton({ userId }: { userId: string }) {
  const { showToast } = useUiStore();
  const [copied, setCopied] = React.useState(false);

  const query = useQuery({
    queryKey: ["adminUserTemporaryPassword", userId],
    queryFn: () => getAdminUserTemporaryPassword(userId),
    enabled: false,
    retry: false,
  });

  async function onCopy() {
    try {
      let pwd = query.data?.data.temporaryPassword;
      if (!pwd) {
        const res = await query.refetch();
        pwd = res.data?.data.temporaryPassword;
      }

      if (pwd) {
        await navigator.clipboard.writeText(pwd);
        showToast("Password copied to clipboard.", "success");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        showToast("Temporary password not available.", "error");
      }
    } catch (err) {
      showToast("Failed to copy password.", "error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground select-none">••••••••</span>
      <Button variant="ghost" size="icon-xs" onClick={onCopy} title="Copy temporary password">
        {copied ? <CheckIcon className="size-3 text-green-600" /> : <CopyIcon className="size-3" />}
      </Button>
    </div>
  );
}

const userSchema = z.object({
  email: z.string().min(1, "Enter an email address.").email("Enter a valid email."),
  firstName: z.string().min(1, "Enter a first name."),
  lastName: z.string().min(1, "Enter a last name."),
  role: AdminRoleSchema,
  password: z.string().optional().or(z.literal("")),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
});

type UserFormData = {
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  password?: string;
  emailVerified: boolean;
  isActive: boolean;
};

const millerSchema = z.object({
  email: z.string().min(1, "Enter an email address.").email("Enter a valid email."),
  firstName: z.string().min(1, "Enter a first name."),
  lastName: z.string().min(1, "Enter a last name."),
});

type MillerFormData = z.infer<typeof millerSchema>;

function CreateMillerDialog(props: {
  org: AdminOrganization | null;
  onClose: () => void;
  isSaving: boolean;
  onCreate: (payload: {
    org: AdminOrganization;
    email: string;
    firstName: string;
    lastName: string;
  }) => void;
}) {
  const org = props.org;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MillerFormData>({
    resolver: zodResolver(millerSchema),
  });

  React.useEffect(() => {
    if (org) {
      reset({ email: "", firstName: "", lastName: "" });
    }
  }, [org, reset]);

  function onSubmit(data: MillerFormData) {
    if (!org) return;
    props.onCreate({
      org,
      ...data,
    });
  }

  return (
    <Dialog open={Boolean(org)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create miller</DialogTitle>
          <DialogDescription>
            This creates a Miller user with a temporary password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="millerEmail">Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Email</InputGroupAddon>
                <InputGroupInput
                  id="millerEmail"
                  placeholder="miller@example.com"
                  {...register("email")}
                />
              </InputGroup>
              <FieldError errors={errors.email ? [errors.email] : []} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="millerFirstName">First name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>First</InputGroupAddon>
                  <InputGroupInput
                    id="millerFirstName"
                    placeholder="First name"
                    {...register("firstName")}
                  />
                </InputGroup>
                <FieldError errors={errors.firstName ? [errors.firstName] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="millerLastName">Last name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>Last</InputGroupAddon>
                  <InputGroupInput
                    id="millerLastName"
                    placeholder="Last name"
                    {...register("lastName")}
                  />
                </InputGroup>
                <FieldError errors={errors.lastName ? [errors.lastName] : []} />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "outline"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function OrganizationsPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");

  const [createOrgOpen, setCreateOrgOpen] = React.useState(false);
  const [editOrg, setEditOrg] = React.useState<AdminOrganization | null>(null);
  const [deleteOrg, setDeleteOrg] = React.useState<AdminOrganization | null>(null);

  const [createMillerOrg, setCreateMillerOrg] = React.useState<AdminOrganization | null>(null);
  const [usersOrgId, setUsersOrgId] = React.useState<string | null>(null);
  const [editUser, setEditUser] = React.useState<{
    org: AdminOrganization;
    user: AdminOrgUser;
  } | null>(null);
  const [deactivateUser, setDeactivateUser] = React.useState<{
    org: AdminOrganization;
    user: AdminOrgUser;
  } | null>(null);



  const organizationsQuery = useQuery({
    queryKey: ["adminOrganizations", search],
    queryFn: () => listAdminOrganizations({ page: 1, limit: 200, search }),
  });

  function formatLocation(org: AdminOrganization) {
    const parts = [org.state, org.district, org.village].filter(
      (v): v is string => typeof v === "string" && v.trim() !== ""
    );
    return parts.length ? parts.join(", ") : "Location not set.";
  }

  const orgs = organizationsQuery.data?.data.items ?? [];
  const usersOrg = React.useMemo(() => orgs.find((o) => o.id === usersOrgId) || null, [orgs, usersOrgId]);

  const createOrgMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      state: string;
      district: string;
      village: string;
    }) => createAdminOrganization(payload),
    onSuccess: (res) => {
      showToast(res.message ?? "Organization created.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setCreateOrgOpen(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Create failed.";
      showToast(message, "error");
    },
  });

  const createMillerMutation = useMutation({
    mutationFn: async (payload: {
      org: AdminOrganization;
      email: string;
      firstName: string;
      lastName: string;
    }) =>
      createMillerUser({
        organizationId: payload.org.id,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      }),
    onSuccess: (res) => {
      showToast(res.message ?? "Miller user created.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setCreateMillerOrg(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Create failed.";
      showToast(message, "error");
    },
  });



  const updateOrgMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      state: string;
      district: string;
      village: string;
    }) =>
      updateAdminOrganization(params.id, {
        name: params.name,
        state: params.state,
        district: params.district,
        village: params.village,
      }),
    onSuccess: (res) => {
      showToast(res.message ?? "Organization updated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setEditOrg(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Update failed.";
      showToast(message, "error");
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => deleteAdminOrganization(id),
    onSuccess: (res) => {
      showToast(res.message ?? "Organization deleted.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setDeleteOrg(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Delete failed.";
      showToast(message, "error");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: AdminRole;
      password?: string;
      emailVerified: boolean;
      isActive: boolean;
    }) =>
      updateAdminUser(payload.id, {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        password: payload.password,
        emailVerified: payload.emailVerified,
        isActive: payload.isActive,
      }),
    onSuccess: (res) => {
      showToast(res.message ?? "User updated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setEditUser(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Update failed.";
      showToast(message, "error");
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => deactivateAdminUser(id),
    onSuccess: (res) => {
      showToast(res.message ?? "User deactivated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
      setDeactivateUser(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Deactivate failed.";
      showToast(message, "error");
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: string) => updateAdminUser(id, { isActive: true }),
    onSuccess: (res) => {
      showToast(res.message ?? "User activated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Activate failed.";
      showToast(message, "error");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Organizations</CardTitle>
            <div className="text-sm text-muted-foreground">
              Manage organizations and users.
            </div>
          </div>
          <Button size="lg" onClick={() => setCreateOrgOpen(true)}>
            New organization
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <Field>
            <FieldLabel htmlFor="search">Search</FieldLabel>
            <InputGroup>
              <InputGroupAddon>Search</InputGroupAddon>
              <InputGroupInput
                id="search"
                placeholder="Type an organization name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </Field>
        </div>

        {organizationsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : organizationsQuery.isError ? (
          <div className="text-sm text-destructive">Failed to load organizations.</div>
        ) : orgs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No organizations found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="w-[260px]">Org ID</TableHead>
                <TableHead className="w-[120px]">Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => {
                const hasMiller = org.users.some((u) => u.role === "MILLER");

                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-[11px] text-muted-foreground">{formatLocation(org)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{org.id}</TableCell>
                    <TableCell>{org.users.length}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Open actions"
                          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setUsersOrgId(org.id)}>Users</DropdownMenuItem>
                          {!hasMiller ? (
                            <DropdownMenuItem onClick={() => setCreateMillerOrg(org)}>
                              Create miller
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => setEditOrg(org)}>Edit organization</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOrg(org)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onCreate={(payload) => createOrgMutation.mutate(payload)}
        isSaving={createOrgMutation.isPending}
      />

      <EditOrganizationDialog
        value={editOrg}
        onClose={() => setEditOrg(null)}
        onSave={(payload) => updateOrgMutation.mutate(payload)}
        isSaving={updateOrgMutation.isPending}
      />

      <AlertDialog open={Boolean(deleteOrg)} onOpenChange={(open) => (!open ? setDeleteOrg(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. It deletes the organization, its users, and all organization data.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteOrgMutation.isPending}
              onClick={() => {
                if (!deleteOrg) return;
                deleteOrgMutation.mutate(deleteOrg.id);
              }}
            >
              {deleteOrgMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(usersOrgId)} onOpenChange={(open) => (!open ? setUsersOrgId(null) : null)}>
        <DialogContent className="sm:max-w-6xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Organization users</DialogTitle>
            <DialogDescription>
              Users linked to {usersOrg?.name ?? "this organization"}.
            </DialogDescription>
          </DialogHeader>

          {usersOrg?.users?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Pwd Changed</TableHead>
                    <TableHead>Temp Pwd</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersOrg.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{`${u.firstName} ${u.lastName}`.trim() || "—"}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <Badge variant={u.mustChangePassword ? "outline" : "default"}>
                          {u.mustChangePassword ? "No" : "Yes"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.role === "MILLER" && u.mustChangePassword ? (
                          <TempPasswordCopyButton userId={u.id} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={u.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Open user actions"
                            className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                          >
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditUser({ org: usersOrg, user: u })}>
                              Edit
                            </DropdownMenuItem>
                            {u.isActive ? (
                              <DropdownMenuItem onClick={() => setDeactivateUser({ org: usersOrg, user: u })}>
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => activateUserMutation.mutate(u.id)}>
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No users linked to this organization.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUsersOrgId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateMillerDialog
        org={createMillerOrg}
        onClose={() => setCreateMillerOrg(null)}
        isSaving={createMillerMutation.isPending}
        onCreate={(payload: {
          org: AdminOrganization;
          email: string;
          firstName: string;
          lastName: string;
        }) => createMillerMutation.mutate(payload)}
      />

      <EditUserDialog
        value={editUser}
        onClose={() => setEditUser(null)}
        isSaving={updateUserMutation.isPending}
        onSave={(payload) => updateUserMutation.mutate(payload)}
      />

      <AlertDialog
        open={Boolean(deactivateUser)}
        onOpenChange={(open) => (!open ? setDeactivateUser(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user</AlertDialogTitle>
            <AlertDialogDescription>
              This disables login for the user. Use Activate to re-enable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deactivateUserMutation.isPending}
              onClick={() => {
                if (!deactivateUser) return;
                deactivateUserMutation.mutate(deactivateUser.user.id);
              }}
            >
              {deactivateUserMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </Card>
  );
}

const orgSchema = z.object({
  name: z.string().min(1, "Enter an organization name."),
  state: z.string().min(1, "Enter a state."),
  district: z.string().min(1, "Enter a district."),
  village: z.string().min(1, "Enter a village."),
});

type OrgFormData = z.infer<typeof orgSchema>;

function CreateOrganizationDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { name: string; state: string; district: string; village: string }) => void;
  isSaving: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
  });

  React.useEffect(() => {
    if (props.open) {
      reset({ name: "", state: "", district: "", village: "" });
    }
  }, [props.open, reset]);

  function onSubmit(data: OrgFormData) {
    props.onCreate(data);
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
          <DialogDescription>Create a new organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="orgName">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput
                  id="orgName"
                  placeholder="Organization name"
                  {...register("name")}
                />
              </InputGroup>
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="orgState">State</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>State</InputGroupAddon>
                  <InputGroupInput
                    id="orgState"
                    placeholder="State"
                    {...register("state")}
                  />
                </InputGroup>
                <FieldError errors={errors.state ? [errors.state] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="orgDistrict">District</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>District</InputGroupAddon>
                  <InputGroupInput
                    id="orgDistrict"
                    placeholder="District"
                    {...register("district")}
                  />
                </InputGroup>
                <FieldError errors={errors.district ? [errors.district] : []} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="orgVillage">Village</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Village</InputGroupAddon>
                <InputGroupInput
                  id="orgVillage"
                  placeholder="Village"
                  {...register("village")}
                />
              </InputGroup>
              <FieldError errors={errors.village ? [errors.village] : []} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditOrganizationDialog(props: {
  value: AdminOrganization | null;
  onClose: () => void;
  onSave: (payload: { id: string; name: string; state: string; district: string; village: string }) => void;
  isSaving: boolean;
}) {
  const org = props.value;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
  });

  React.useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        state: org.state ?? "",
        district: org.district ?? "",
        village: org.village ?? "",
      });
    }
  }, [org, reset]);

  function onSubmit(data: OrgFormData) {
    if (!org) return;
    props.onSave({
      id: org.id,
      ...data,
    });
  }

  return (
    <Dialog open={Boolean(org)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
          <DialogDescription>Update the organization details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="orgEditName">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput
                  id="orgEditName"
                  placeholder="Organization name"
                  {...register("name")}
                />
              </InputGroup>
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="orgEditState">State</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>State</InputGroupAddon>
                  <InputGroupInput
                    id="orgEditState"
                    placeholder="State"
                    {...register("state")}
                  />
                </InputGroup>
                <FieldError errors={errors.state ? [errors.state] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="orgEditDistrict">District</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>District</InputGroupAddon>
                  <InputGroupInput
                    id="orgEditDistrict"
                    placeholder="District"
                    {...register("district")}
                  />
                </InputGroup>
                <FieldError errors={errors.district ? [errors.district] : []} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="orgEditVillage">Village</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Village</InputGroupAddon>
                <InputGroupInput
                  id="orgEditVillage"
                  placeholder="Village"
                  {...register("village")}
                />
              </InputGroup>
              <FieldError errors={errors.village ? [errors.village] : []} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog(props: {
  value: { org: AdminOrganization; user: AdminOrgUser } | null;
  onClose: () => void;
  isSaving: boolean;
  onSave: (payload: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    password?: string;
    emailVerified: boolean;
    isActive: boolean;
  }) => void;
}) {
  const value = props.value;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
  });

  React.useEffect(() => {
    if (value) {
      reset({
        email: value.user.email,
        firstName: value.user.firstName,
        lastName: value.user.lastName,
        role: value.user.role,
        password: "",
        emailVerified: value.user.isEmailVerified,
        isActive: value.user.isActive,
      });
    }
  }, [value, reset]);

  function onSubmit(data: UserFormData) {
    if (!value) return;
    props.onSave({
      id: value.user.id,
      ...data,
      password: data.password || undefined,
    } as any);
  }

  return (
    <Dialog open={Boolean(value)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update user details for {value?.org.name ?? "this organization"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="editUserEmail">Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Email</InputGroupAddon>
                <InputGroupInput
                  id="editUserEmail"
                  placeholder="user@example.com"
                  {...register("email")}
                />
              </InputGroup>
              <FieldError errors={errors.email ? [errors.email] : []} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="editUserFirstName">First name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>First</InputGroupAddon>
                  <InputGroupInput
                    id="editUserFirstName"
                    placeholder="First name"
                    {...register("firstName")}
                  />
                </InputGroup>
                <FieldError errors={errors.firstName ? [errors.firstName] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="editUserLastName">Last name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>Last</InputGroupAddon>
                  <InputGroupInput
                    id="editUserLastName"
                    placeholder="Last name"
                    {...register("lastName")}
                  />
                </InputGroup>
                <FieldError errors={errors.lastName ? [errors.lastName] : []} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {EDIT_USER_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="editUserPassword">New password (optional)</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>Pass</InputGroupAddon>
                  <InputGroupInput
                    id="editUserPassword"
                    type="password"
                    placeholder="Leave blank to keep current"
                    {...register("password")}
                  />
                </InputGroup>
                <FieldError errors={errors.password ? [errors.password] : []} />
              </Field>
            </div>

            <div className="flex gap-6 mt-2">
              <Field>
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    control={control}
                    name="emailVerified"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    )}
                  />
                  <span>Email verified</span>
                </label>
              </Field>

              <Field>
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    )}
                  />
                  <span>Active</span>
                </label>
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
