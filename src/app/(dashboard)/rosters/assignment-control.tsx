"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAssignment } from "@/features/assignment/hooks/useAssignmentMutations";
import { cn } from "@/lib/utils/cn";
import { Check, CircleDot, X } from "lucide-react";

interface AssignmentControlProps {
  subShiftId: number;
  currentId?: number;
  items: { id: number; fullName: string; isAvailable?: boolean }[];
  placeholder?: string;
  warning?: boolean;
  className?: string;
  // Called after a successful confirm or a cancel - lets a multi-capacity
  // row's "Add" trigger collapse back to its button state.
  onDone?: () => void;
}

// Click the select -> pick an employee -> confirm. Picking only stages the
// choice; nothing is assigned until the confirm button is clicked, and the
// cancel button reverts to the prior value without mutating anything.
export function AssignmentControl({
  subShiftId,
  currentId,
  items,
  placeholder = "Unassigned",
  warning,
  className,
  onDone,
}: AssignmentControlProps) {
  const [pendingId, setPendingId] = useState<number | undefined>();
  const createMutation = useCreateAssignment();

  const staged = pendingId !== undefined && pendingId !== currentId;
  const value = staged ? pendingId : currentId;

  const handleConfirm = () => {
    if (!staged || pendingId === undefined) return;
    createMutation.mutate(
      { employeeId: pendingId, subShiftId },
      {
        onSuccess: () => {
          setPendingId(undefined);
          onDone?.();
        },
      }
    );
  };

  const handleCancel = () => {
    setPendingId(undefined);
    onDone?.();
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select value={value ? String(value) : undefined} onValueChange={(v) => setPendingId(Number(v))}>
        <SelectTrigger
          size="sm"
          className={cn(
            "w-40 text-xs",
            warning && !staged && "border-amber-500 text-amber-700 dark:text-amber-400"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              <span className="flex items-center gap-1.5">
                {item.isAvailable && (
                  <CircleDot className="h-3 w-3 text-green-600" aria-label="Đã đăng ký ca này" />
                )}
                {item.fullName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {staged && (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-600 hover:text-green-700"
            title="Confirm"
            disabled={createMutation.isPending}
            onClick={handleConfirm}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            title="Cancel"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
