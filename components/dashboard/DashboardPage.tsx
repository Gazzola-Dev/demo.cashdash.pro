"use client";

import useDemoData from "@/hooks/useDemoData";

const DashboardPage = () => {
  const { task: taskData, project } = useDemoData();
  const tasks = project?.tasks || [];

  // Simple milestone due date
  const milestoneDueDate = "23-Feb-25";

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* TaskListCard - Spans 8 columns */}
        <div className="col-span-8">
          {/* <TaskListCard tasks={tasks} milestoneDueDate={milestoneDueDate} /> */}
        </div>

        {/* TaskPriorityCard - Spans 4 columns */}
        <div className="col-span-4">
          {/* <TaskPriorityCard tasks={tasks} /> */}
        </div>
      </div>

      {/* ProgressCard - Full width */}
      <div className="w-full">{/* <ProgressCard tasks={tasks} /> */}</div>

      {/* GanttCard - Full width */}
      <div className="w-full">{/* <GanttCard tasks={tasks} /> */}</div>
    </div>
  );
};

export default DashboardPage;
