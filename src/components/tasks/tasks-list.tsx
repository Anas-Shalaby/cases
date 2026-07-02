"use client";

import { useMemo, useState } from "react";

import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import type { CaseTaskWithRelations } from "@/types/database";

type TaskFilter = "all" | "pending" | "completed";
type TaskView = "mine" | "all";

interface TasksListProps {
  myTasks: CaseTaskWithRelations[];
  allTasks?: CaseTaskWithRelations[];
  isCoordinator?: boolean;
  currentUserId: string;
}

export function TasksList({
  myTasks,
  allTasks = [],
  isCoordinator = false,
  currentUserId,
}: TasksListProps) {
  const [view, setView] = useState<TaskView>("mine");
  const [filter, setFilter] = useState<TaskFilter>("all");

  const activeTasks = view === "mine" ? myTasks : allTasks;

  const filteredTasks = useMemo(() => {
    if (filter === "all") return activeTasks;
    return activeTasks.filter((task) => task.status === filter);
  }, [activeTasks, filter]);

  const pendingCount = activeTasks.filter((t) => t.status === "pending").length;
  const completedCount = activeTasks.filter(
    (t) => t.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {isCoordinator && allTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={view === "mine" ? "default" : "outline"}
            onClick={() => setView("mine")}
          >
            مسندة إليّ ({myTasks.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "all" ? "default" : "outline"}
            onClick={() => setView("all")}
          >
            كل المهام ({allTasks.length})
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          الكل ({activeTasks.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          معلّقة ({pendingCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          مكتملة ({completedCount})
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
          {filter === "pending"
            ? "لا توجد مهام معلّقة"
            : filter === "completed"
              ? "لا توجد مهام مكتملة"
              : view === "mine"
                ? "لا توجد مهام مُسندة إليك"
                : "لا توجد مهام في النظام"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canComplete={
                task.assigned_to === currentUserId &&
                task.status === "pending"
              }
              canDelete={isCoordinator}
              showAssignee={view === "all"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
