"use client";

import { ClipboardList } from "lucide-react";

import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NavButton } from "@/components/ui/nav-button";
import type { CaseTaskWithRelations } from "@/types/database";

interface MyAssignedTasksProps {
  tasks: CaseTaskWithRelations[];
}

export function MyAssignedTasks({ tasks }: MyAssignedTasksProps) {
  const pendingTasks = tasks.filter((task) => task.status === "pending");

  if (pendingTasks.length === 0) {
    return null;
  }

  const preview = pendingTasks.slice(0, 3);

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="size-5 text-violet-600" />
          مهامي المخصصة
          <Badge className="bg-violet-600 text-white">
            {pendingTasks.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          مهام أُسندت إليك من المنسق — يجب إنجازها قبل الموعد المحدد
        </CardDescription>
        <CardAction>
          <NavButton variant="outline" size="sm" href="/tasks">
            عرض الكل
          </NavButton>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {preview.map((task) => (
          <TaskCard key={task.id} task={task} canComplete />
        ))}
        {pendingTasks.length > 3 && (
          <p className="text-muted-foreground text-center text-xs">
            و{pendingTasks.length - 3} مهام أخرى —{" "}
            <NavButton variant="link" size="sm" className="h-auto p-0" href="/tasks">
              عرض الكل
            </NavButton>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
