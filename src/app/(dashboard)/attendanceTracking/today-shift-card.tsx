"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Assignment } from "@/features/assignment/types";
import {
  useCheckInAssignment,
  useCheckOutAssignment,
} from "@/features/assignment/hooks/useAssignmentMutations";
import { TaskTemplate } from "@/features/taskTemplate/types";
import { Task } from "@/features/task/types";
import { getTime } from "@/lib/utils/dateTimeHelpers";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { TaskItem } from "./task-item";

interface TodayShiftCardProps {
  assignment: Assignment;
  branchName: string;
  tasks: Task[];
  taskTemplates: TaskTemplate[];
}

export function TodayShiftCard({ assignment, branchName, tasks, taskTemplates }: TodayShiftCardProps) {
  const checkIn = useCheckInAssignment();
  const checkOut = useCheckOutAssignment();
  const [confirmCheckoutOpen, setConfirmCheckoutOpen] = useState(false);

  const isCheckedIn = !!assignment.actualStartTime;
  const isCheckedOut = !!assignment.actualEndTime;

  // Real task instances take priority; the branch's task templates are only
  // a read-only fallback for a shift whose Task rows haven't been
  // provisioned yet (see wire-task-completion-and-checkout-gate's design.md
  // Decision 3).
  const hasRealTasks = tasks.length > 0;

  const mandatoryTasks = hasRealTasks
    ? tasks.filter((t) => t.type === "SHARED_MANDATORY" || t.type === "DEDICATED")
    : taskTemplates.filter((t) => t.type === "SHARED_MANDATORY");
  const todoTasks = hasRealTasks
    ? tasks.filter((t) => t.type === "SHARED_OPTIONAL")
    : taskTemplates.filter((t) => t.type === "SHARED_OPTIONAL");

  const mandatoryPending = hasRealTasks
    ? (mandatoryTasks as Task[]).filter((t) => t.status !== "COMPLETED")
    : [];
  const todoPending = hasRealTasks
    ? (todoTasks as Task[]).filter((t) => t.status !== "COMPLETED")
    : [];

  const statusLabel = isCheckedOut ? "Đã kết ca" : isCheckedIn ? "Đang trong ca" : "Chưa vào ca";
  const statusVariant = isCheckedOut ? "secondary" : isCheckedIn ? "default" : "outline";

  const runCheckOut = () => checkOut.mutate({ id: assignment.id, data: {} });

  const handleCheckOutClick = () => {
    if (todoPending.length > 0) {
      setConfirmCheckoutOpen(true);
      return;
    }
    runCheckOut();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{assignment.subShift?.title ?? "Ca làm việc"}</CardTitle>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {branchName}
          {assignment.subShift && (
            <>
              {" · "}
              {getTime(new Date(assignment.subShift.startTime))} -{" "}
              {getTime(new Date(assignment.subShift.endTime))}
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCheckedIn && (
          <p className="text-sm text-muted-foreground">
            Vào ca lúc {getTime(new Date(assignment.actualStartTime!))}
            {isCheckedOut && ` · Kết ca lúc ${getTime(new Date(assignment.actualEndTime!))}`}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {!isCheckedIn && (
              <Button
                onClick={() => checkIn.mutate({ id: assignment.id, data: {} })}
                disabled={checkIn.isPending}
              >
                Vào ca
              </Button>
            )}
            {isCheckedIn && !isCheckedOut && (
              <Button
                variant="outline"
                onClick={handleCheckOutClick}
                disabled={checkOut.isPending || mandatoryPending.length > 0}
              >
                Kết ca
              </Button>
            )}
          </div>
          {isCheckedIn && !isCheckedOut && mandatoryPending.length > 0 && (
            <p className="text-xs text-destructive">
              Cần hoàn thành: {mandatoryPending.map((t) => t.title).join(", ")}
            </p>
          )}
        </div>

        {(mandatoryTasks.length > 0 || todoTasks.length > 0) && (
          <div className="space-y-2 border-t border-border pt-3">
            {mandatoryTasks.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <ListChecks className="h-3.5 w-3.5" /> Nhiệm vụ bắt buộc
                </p>
                <ul className="space-y-1">
                  {hasRealTasks
                    ? (mandatoryTasks as Task[]).map((task) => <TaskItem key={task.id} task={task} />)
                    : (mandatoryTasks as TaskTemplate[]).map((template) => (
                        <li key={template.id} className="flex items-center gap-1.5 text-sm">
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {template.title}
                        </li>
                      ))}
                </ul>
              </div>
            )}
            {todoTasks.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Việc cần làm
                </p>
                <ul className="space-y-1">
                  {hasRealTasks
                    ? (todoTasks as Task[]).map((task) => <TaskItem key={task.id} task={task} />)
                    : (todoTasks as TaskTemplate[]).map((template) => (
                        <li key={template.id} className="flex items-center gap-1.5 text-sm">
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {template.title}
                        </li>
                      ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={confirmCheckoutOpen} onOpenChange={setConfirmCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Còn việc cần làm chưa hoàn thành</DialogTitle>
            <DialogDescription>
              Bạn còn {todoPending.length} việc cần làm chưa hoàn thành:{" "}
              {todoPending.map((t) => t.title).join(", ")}. Bạn vẫn có thể kết ca.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCheckoutOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                setConfirmCheckoutOpen(false);
                runCheckOut();
              }}
              disabled={checkOut.isPending}
            >
              Vẫn kết ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
