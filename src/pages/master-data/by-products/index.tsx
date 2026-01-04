import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


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
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  createAdminByProduct,
  deactivateAdminByProduct,
  listAdminByProducts,
  updateAdminByProduct,
} from "@/lib/adminByProducts";
import type { AdminByProduct } from "@/types/adminByProducts";

const DEFAULT_PAGE_SIZE = 10;

import {
  ByProductDialog,
  type ByProductFormData,
} from "./ByProductDialog";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function ByProductsPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [includeInactive, setIncludeInactive] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(DEFAULT_PAGE_SIZE);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminByProduct | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminByProduct | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [search, includeInactive]);

  const listQuery = useQuery({
    queryKey: ["adminByProducts", page, limit, search, includeInactive],
    queryFn: () =>
      listAdminByProducts({
        page,
        limit,
        search,
        includeInactive,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: ByProductFormData) =>
      createAdminByProduct({
        name: data.name,
        description: data.description?.trim() ? data.description.trim() : undefined,
        isActive: data.isActive,
      }),
    onSuccess: (res) => {
      showToast(res.message ?? "By-product created.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminByProducts"] });
      setCreateOpen(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Create failed.";
      showToast(message, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; data: ByProductFormData }) => {
      return updateAdminByProduct(params.id, {
        name: params.data.name,
        description: params.data.description?.trim() ? params.data.description.trim() : "",
        isActive: params.data.isActive,
      });
    },
    onSuccess: (res) => {
      showToast(res.message ?? "By-product updated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminByProducts"] });
      setEditing(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Update failed.";
      showToast(message, "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminByProduct(id),
    onSuccess: (res) => {
      showToast(res.message ?? "By-product deactivated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["adminByProducts"] });
      setDeactivateTarget(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Deactivate failed.";
      showToast(message, "error");
    },
  });

  const items = listQuery.data?.data.items ?? [];
  const total = listQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>By Products</CardTitle>
            <div className="text-sm text-muted-foreground">Maintain the master list of by-products.</div>
          </div>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="max-w-sm flex-1">
            <Field>
              <FieldLabel htmlFor="search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="search"
                  placeholder="Type a name or description"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
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

        {listQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : listQuery.isError ? (
          <div className="text-sm text-destructive">Failed to load by-products.</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No by-products found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((bp) => (
                <TableRow key={bp.id}>
                  <TableCell className="font-medium">{bp.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="line-clamp-2">{bp.description ?? "—"}</div>
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={bp.isActive} />
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
                        <DropdownMenuItem onClick={() => setEditing(bp)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeactivateTarget(bp)}
                          disabled={!bp.isActive}
                        >
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <ByProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New by-product"
        description="Create a new by-product for millers to use in sales."
        initialValues={{ name: "", description: "", isActive: true }}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
      />

      <ByProductDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit by-product"
        description="Update the by-product details."
        initialValues={{
          name: editing?.name ?? "",
          description: editing?.description ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({ id: editing.id, data });
        }}
        isSaving={updateMutation.isPending}
      />

      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate by-product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the by-product from miller dropdowns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) {
                  deactivateMutation.mutate(deactivateTarget.id);
                }
              }}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
