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
  InputGroupTextarea,
} from "@/components/ui/input-group";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import { listMasterRiceTypes } from "@/lib/masterRiceTypes";
import {
  createMasterRiceVariety,
  listMasterRiceVarieties,
  updateMasterRiceVariety,
} from "@/lib/masterRiceVarieties";
import type { MasterRiceVariety } from "@/types/masterRiceVarieties";
import type { MasterRiceType } from "@/types/masterRiceTypes";

const varietySchema = z.object({
  name: z.string().min(1, "Enter a variety name."),
  description: z.string().optional(),
  riceTypeCode: z.string().min(1, "Select a rice type."),
  isActive: z.boolean(),
});

type VarietyFormData = z.infer<typeof varietySchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function CreateVarietyDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riceTypes: MasterRiceType[];
  isSaving: boolean;
  onSave: (data: VarietyFormData) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<VarietyFormData>({
    resolver: zodResolver(varietySchema),
    defaultValues: { isActive: true, riceTypeCode: "" },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (props.open) reset({ name: "", description: "", riceTypeCode: "", isActive: true });
  }, [props.open, reset]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New variety</DialogTitle>
          <DialogDescription>
            Varieties are shared master data. Keep names consistent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="createVarietyName">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="createVarietyName" placeholder="Sona Masoori" {...register("name")} />
              </InputGroup>
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>
            <Field>
              <FieldLabel htmlFor="createVarietyDesc">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea id="createVarietyDesc" placeholder="Optional" {...register("description")} />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Rice type</FieldLabel>
              <Controller
                control={control}
                name="riceTypeCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {props.riceTypes.map((t) => (
                          <SelectItem key={t.id} value={t.code}>
                            {t.code} — {t.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.riceTypeCode ? [errors.riceTypeCode] : []} />
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
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving || !isValid}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditVarietyDialog(props: {
  item: MasterRiceVariety | null;
  onClose: () => void;
  riceTypes: MasterRiceType[];
  isSaving: boolean;
  onSave: (data: VarietyFormData) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<VarietyFormData>({
    resolver: zodResolver(varietySchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (props.item) {
      reset({
        name: props.item.name,
        description: props.item.description ?? "",
        riceTypeCode: props.item.riceType.code,
        isActive: props.item.isActive,
      });
    }
  }, [props.item, reset]);

  return (
    <Dialog open={Boolean(props.item)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit variety</DialogTitle>
          <DialogDescription>Update the variety details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="editVarietyName">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="editVarietyName" {...register("name")} />
              </InputGroup>
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>
            <Field>
              <FieldLabel htmlFor="editVarietyDesc">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea id="editVarietyDesc" {...register("description")} />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Rice type</FieldLabel>
              <Controller
                control={control}
                name="riceTypeCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {props.riceTypes.map((t) => (
                          <SelectItem key={t.id} value={t.code}>
                            {t.code} — {t.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.riceTypeCode ? [errors.riceTypeCode] : []} />
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
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving || !isValid || !isDirty}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VarietiesPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [filterRiceTypeCode, setFilterRiceTypeCode] = React.useState<string>("ALL");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<MasterRiceVariety | null>(null);

  const riceTypesQuery = useQuery({
    queryKey: ["masterRiceTypes", "activeOnly"],
    queryFn: () => listMasterRiceTypes({ includeInactive: false }),
  });

  const varietiesQuery = useQuery({
    queryKey: ["masterRiceVarieties", search, includeInactive, filterRiceTypeCode],
    queryFn: () =>
      listMasterRiceVarieties({
        search,
        includeInactive,
        riceTypeCode: filterRiceTypeCode === "ALL" ? undefined : filterRiceTypeCode,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: VarietyFormData) => {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        riceTypeCode: data.riceTypeCode,
        isActive: data.isActive,
      };

      if (editItem) {
        return updateMasterRiceVariety(editItem.id, payload);
      }
      return createMasterRiceVariety(payload);
    },
    onSuccess: (res) => {
      showToast(res.message ?? "Rice variety saved.", "success");
      void queryClient.invalidateQueries({ queryKey: ["masterRiceVarieties"] });
      setCreateOpen(false);
      setEditItem(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Save failed.";
      showToast(message, "error");
    },
  });

  const riceTypes = riceTypesQuery.data?.data.items ?? [];
  const items = varietiesQuery.data?.data.items ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Varieties</CardTitle>
            <div className="text-sm text-muted-foreground">
              Maintain the master list of rice varieties (example: Sona Masoori, HMT). Each variety belongs to a rice type.
            </div>
          </div>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Field>
              <FieldLabel htmlFor="search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="search"
                  placeholder="Type a name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Field>
          </div>

          <div className="w-[200px]">
            <Field>
              <FieldLabel>Rice type</FieldLabel>
              <Select
                value={filterRiceTypeCode}
                onValueChange={(value) => setFilterRiceTypeCode(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">All types</SelectItem>
                    {riceTypes.map((t) => (
                      <SelectItem key={t.id} value={t.code}>
                        {t.code} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex items-center pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeInactive}
                onCheckedChange={(v) => setIncludeInactive(Boolean(v))}
              />
              <span>Show inactive</span>
            </label>
          </div>
        </div>

        {varietiesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : varietiesQuery.isError ? (
          <div className="text-sm text-destructive">Failed to load varieties.</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No varieties found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rice type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    {v.description ? (
                      <div className="text-[11px] text-muted-foreground truncate max-w-[300px]">
                        {v.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">{v.riceType.code}</TableCell>
                  <TableCell>
                    <ActiveBadge isActive={v.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Open actions"
                        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditItem(v)}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CreateVarietyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        riceTypes={riceTypes}
        isSaving={saveMutation.isPending}
        onSave={(data) => saveMutation.mutate(data)}
      />

      <EditVarietyDialog
        item={editItem}
        onClose={() => setEditItem(null)}
        riceTypes={riceTypes}
        isSaving={saveMutation.isPending}
        onSave={(data) => saveMutation.mutate(data)}
      />
    </Card>
  );
}
