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
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { MasterRiceType } from "@/types/masterRiceTypes";

export const riceTypeSchema = z.object({
    code: z.string().min(1, "Enter a rice type code.").toUpperCase(),
    name: z.string().min(1, "Enter a rice type name."),
    isActive: z.boolean(),
});

export type RiceTypeFormData = z.infer<typeof riceTypeSchema>;

export function CreateRiceTypeDialog(props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSaving: boolean;
    onSave: (data: RiceTypeFormData) => void;
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid },
    } = useForm<RiceTypeFormData>({
        resolver: zodResolver(riceTypeSchema),
        defaultValues: { isActive: true },
        mode: "onChange",
    });

    React.useEffect(() => {
        if (props.open) reset({ code: "", name: "", isActive: true });
    }, [props.open, reset]);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New rice type</DialogTitle>
                    <DialogDescription>
                        Codes are stored in uppercase. Use short stable codes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="createCode">Code</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Code</InputGroupAddon>
                                <InputGroupInput id="createCode" placeholder="COMMON" {...register("code")} />
                            </InputGroup>
                            <FieldError errors={errors.code ? [errors.code] : []} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="createName">Name</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Name</InputGroupAddon>
                                <InputGroupInput id="createName" placeholder="Common" {...register("name")} />
                            </InputGroup>
                            <FieldError errors={errors.name ? [errors.name] : []} />
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

export function EditRiceTypeDialog(props: {
    item: MasterRiceType | null;
    onClose: () => void;
    isSaving: boolean;
    onSave: (data: RiceTypeFormData) => void;
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid, isDirty },
    } = useForm<RiceTypeFormData>({
        resolver: zodResolver(riceTypeSchema),
        mode: "onChange",
    });

    React.useEffect(() => {
        if (props.item) {
            reset({
                code: props.item.code,
                name: props.item.name,
                isActive: props.item.isActive,
            });
        }
    }, [props.item, reset]);

    return (
        <Dialog open={Boolean(props.item)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit rice type</DialogTitle>
                    <DialogDescription>Update the rice type details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="editCode">Code</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Code</InputGroupAddon>
                                <InputGroupInput id="editCode" disabled {...register("code")} />
                            </InputGroup>
                            <FieldError errors={errors.code ? [errors.code] : []} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="editName">Name</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Name</InputGroupAddon>
                                <InputGroupInput id="editName" {...register("name")} />
                            </InputGroup>
                            <FieldError errors={errors.name ? [errors.name] : []} />
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
