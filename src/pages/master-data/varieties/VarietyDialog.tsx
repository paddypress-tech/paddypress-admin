import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import type { MasterRiceVariety } from "@/types/masterRiceVarieties";
import type { MasterRiceType } from "@/types/masterRiceTypes";

export const varietySchema = z.object({
    name: z.string().min(1, "Enter a variety name."),
    description: z.string().optional(),
    riceTypeCode: z.string().min(1, "Select a rice type."),
    isActive: z.boolean(),
});

export type VarietyFormData = z.infer<typeof varietySchema>;

export function CreateVarietyDialog(props: {
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

export function EditVarietyDialog(props: {
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
