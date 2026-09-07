"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCompleteTask } from "@/features/task/hooks";
import { Task } from "@/features/task/types";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const completeTask = useCompleteTask();
  const isCompleted = task.status === "COMPLETED";

  const handleConfirm = () => {
    completeTask.mutate(
      { id: task.id, data: note.trim() ? { note: note.trim() } : {} },
      {
        onSuccess: () => {
          setOpen(false);
          setNote("");
        },
      }
    );
  };

  return (
    <>
      <li className="flex items-start gap-1.5 text-sm">
        <Checkbox
          checked={isCompleted}
          disabled={isCompleted}
          onCheckedChange={() => !isCompleted && setOpen(true)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <span className={isCompleted ? "text-muted-foreground line-through" : ""}>
            {task.title}
          </span>
          {isCompleted && task.completion?.note && (
            <p className="text-xs text-muted-foreground">Ghi chú: {task.completion.note}</p>
          )}
        </div>
      </li>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành nhiệm vụ</DialogTitle>
            <DialogDescription>{task.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`task-note-${task.id}`}>
              Ghi chú hoàn thành (không bắt buộc)
            </label>
            <Textarea
              id={`task-note-${task.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú nếu cần..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={completeTask.isPending}>
              Huỷ
            </Button>
            <Button onClick={handleConfirm} disabled={completeTask.isPending}>
              Xác nhận hoàn thành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
