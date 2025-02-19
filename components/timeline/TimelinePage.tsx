"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import useDemoData from "@/hooks/useDemoData";
import { TaskResult } from "@/types/task.types";
import { useState } from "react";

const formatDate = (date: Date): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const TaskList = ({ tasks }: { tasks: TaskResult[] }) => {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {tasks.map(task => (
          <Card key={task.task.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{task.task.title}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {task.task_schedule?.start_date &&
                  formatDate(new Date(task.task_schedule.start_date))}
                {" - "}
                {task.task_schedule?.due_date &&
                  formatDate(new Date(task.task_schedule.due_date))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

const Timeline = ({ tasks }: { tasks: TaskResult[] }) => {
  // Calculate timeline scale
  const timeScale = tasks.reduce(
    (acc, task) => {
      if (task.task_schedule?.start_date) {
        const startTime = new Date(task.task_schedule.start_date).getTime();
        acc.minTime = Math.min(acc.minTime, startTime);
      }
      if (task.task_schedule?.due_date) {
        const endTime = new Date(task.task_schedule.due_date).getTime();
        acc.maxTime = Math.max(acc.maxTime, endTime);
      }
      return acc;
    },
    { minTime: Infinity, maxTime: -Infinity },
  );

  const timelineWidth = Math.max(1000, window.innerWidth - 40); // Minimum 1000px or screen width
  const msPerPixel = (timeScale.maxTime - timeScale.minTime) / timelineWidth;

  const getTaskColor = (index: number): string => {
    const colors = [
      "bg-blue-500/20 border-blue-500",
      "bg-green-500/20 border-green-500",
      "bg-purple-500/20 border-purple-500",
      "bg-orange-500/20 border-orange-500",
      "bg-pink-500/20 border-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-full w-full p-4">
      <ScrollArea className="h-full w-full rounded-md border">
        <div style={{ width: `${timelineWidth}px` }} className="relative h-40">
          {tasks.map((task, index) => {
            if (
              !task.task_schedule?.start_date ||
              !task.task_schedule?.due_date
            )
              return null;

            const startTime = new Date(task.task_schedule.start_date).getTime();
            const endTime = new Date(task.task_schedule.due_date).getTime();
            const duration = endTime - startTime;

            const left = (startTime - timeScale.minTime) / msPerPixel;
            const width = duration / msPerPixel;

            return (
              <div
                key={task.task.id}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  width: `${width}px`,
                  top: `${(index % 3) * 30 + 10}px`,
                  height: "25px",
                }}
                className={`rounded border flex items-center px-2 ${getTaskColor(index)}`}
              >
                <span className="text-xs truncate">{task.task.title}</span>
              </div>
            );
          })}

          {/* Time scale */}
          <div className="absolute bottom-0 left-0 right-0 h-6 border-t flex">
            {Array.from({ length: 10 }).map((_, i) => {
              const time = new Date(
                timeScale.minTime +
                  (i * (timeScale.maxTime - timeScale.minTime)) / 10,
              );
              return (
                <div
                  key={i}
                  style={{ left: `${(i * timelineWidth) / 10}px` }}
                  className="absolute transform -translate-x-1/2"
                >
                  <div className="h-2 border-l" />
                  <div className="text-xs text-muted-foreground">
                    {formatDate(time)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

const TimelinePage = () => {
  const { project } = useDemoData();
  const tasks = project?.tasks || [];
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="h-screen flex flex-col p-4">
      {/* Top section (66%) */}
      <div className="h-2/3 flex gap-4 mb-4">
        {/* Calendar */}
        <Card className="w-96 p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </Card>

        {/* Task list */}
        <Card className="flex-1">
          <TaskList tasks={tasks} />
        </Card>
      </div>

      {/* Bottom section (33%) */}
      <Card className="flex-1">
        <Timeline tasks={tasks} />
      </Card>
    </div>
  );
};

export default TimelinePage;
