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

export const stateSchema = z.object({
    code: z
        .string()
        .min(1, "Enter a state code.")
        .max(10, "Max 10 characters.")
        .toUpperCase(),
    name: z
        .string()
        .min(1, "Enter a state name.")
        .max(100, "Max 100 characters."),
    isActive: z.boolean(),
});

export type StateFormData = z.infer<typeof stateSchema>;

export function LocationsStateDialog(props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    initialValues: StateFormData;
    onSave: (data: StateFormData) => void;
    isSaving: boolean;
    disableCode?: boolean;
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid, isDirty },
    } = useForm<StateFormData>({
        resolver: zodResolver(stateSchema),
        defaultValues: props.initialValues,
        mode: "onChange",
    });

    React.useEffect(() => {
        if (props.open) {
            reset(props.initialValues);
        }
    }, [props.open, props.initialValues, reset]);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogDescription>{props.description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="stateCode">Code</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Code</InputGroupAddon>
                                <InputGroupInput
                                    id="stateCode"
                                    placeholder="AP"
                                    disabled={props.disableCode}
                                    {...register("code")}
                                />
                            </InputGroup>
                            <FieldError errors={errors.code ? [errors.code] : []} />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="stateName">Name</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>Name</InputGroupAddon>
                                <InputGroupInput
                                    id="stateName"
                                    placeholder="Andhra Pradesh"
                                    {...register("name")}
                                />
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
                                (props.disableCode ? !isDirty : false)
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
