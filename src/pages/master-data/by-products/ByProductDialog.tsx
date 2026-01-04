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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const byProductSchema = z.object({
    name: z.string().min(1, "Enter a by-product name."),
    description: z.string().optional(),
    isActive: z.boolean(),
});

export type ByProductFormData = z.infer<typeof byProductSchema>;

interface ByProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    initialValues: ByProductFormData;
    onSave: (data: ByProductFormData) => void;
    isSaving: boolean;
}

export function ByProductDialog(props: ByProductDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid, isDirty },
    } = useForm<ByProductFormData>({
        resolver: zodResolver(byProductSchema),
        defaultValues: props.initialValues,
        mode: "onChange",
    });

    React.useEffect(() => {
        if (props.open) reset(props.initialValues);
    }, [props.open, props.initialValues, reset]);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogDescription>{props.description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="byProductName">Name</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Name</InputGroupAddon>
                                <InputGroupInput
                                    id="byProductName"
                                    placeholder="E.g. Bran"
                                    {...register("name")}
                                />
                            </InputGroup>
                            <FieldError errors={errors.name ? [errors.name] : []} />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="byProductDescription">Description</FieldLabel>
                            <Textarea
                                id="byProductDescription"
                                placeholder="Optional description"
                                rows={4}
                                {...register("description")}
                            />
                            <FieldError errors={errors.description ? [errors.description] : []} />
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => props.onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                props.isSaving ||
                                !isValid ||
                                (props.title.startsWith("Edit") ? !isDirty : false)
                            }
                        >
                            {props.isSaving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
