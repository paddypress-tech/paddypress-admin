import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BagRatesResetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReset: () => void;
    isResetting: boolean;
    isSaving: boolean;
    riceTypesCount: number;
    hasYearSelected: boolean;
}

export function BagRatesResetDialog({
    open,
    onOpenChange,
    onReset,
    isResetting,
    isSaving,
    riceTypesCount,
    hasYearSelected,
}: BagRatesResetDialogProps) {
    const [resetConfirmText, setResetConfirmText] = React.useState("");

    React.useEffect(() => {
        if (!open) setResetConfirmText("");
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset bag rates?</DialogTitle>
                    <DialogDescription>
                        This will set all bag rates to 0.00 for the selected crop year and season. This is
                        an admin-only action.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <div className="text-sm">Type RESET to confirm</div>
                    <Input
                        value={resetConfirmText}
                        onChange={(e) => setResetConfirmText(e.target.value)}
                        placeholder="RESET"
                        autoComplete="off"
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onReset}
                        disabled={
                            isSaving ||
                            isResetting ||
                            riceTypesCount === 0 ||
                            !hasYearSelected ||
                            resetConfirmText !== "RESET"
                        }
                    >
                        {isResetting ? "Resetting…" : "Reset to zero"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
