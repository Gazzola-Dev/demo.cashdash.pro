import { useListTasks, useUpdateTask } from "@/hooks/task.hooks";
import { TaskWithDetails } from "@/types/task.types";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import configuration from "@/configuration";
import { useListMembers } from "@/hooks/member.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { Json, Tables } from "@/types/database.types";

// Define the base user type
type UserProfile = {
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  current_project_id: string | null;
  display_name: string | null;
  github_username: string | null;
  id: string;
  notification_preferences: Json;
  updated_at: string;
  username: string;
  website: string | null;
};

// Define the normalized task data type
type NormalizedTaskData = Omit<TaskWithDetails, "comments"> & {
  comments:
    | Array<{
        content: Json;
        content_id: string;
        content_type: "project" | "task" | "subtask" | "comment";
        created_at: string;
        id: string;
        is_edited: boolean;
        parent_id: string | null;
        thread_id: string | null;
        updated_at: string;
        user_id: string;
        user: UserProfile;
      }>
    | undefined;
};

const STATUS_OPTIONS: Tables<"tasks">["status"][] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "completed",
];

const PRIORITY_OPTIONS: Tables<"tasks">["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

interface TaskTableProps {
  projectId: string;
  projectSlug: string;
}

export default function TaskTable({ projectId, projectSlug }: TaskTableProps) {
  const router = useRouter();
  const { toast } = useToastQueue();
  const { mutate: updateTask } = useUpdateTask();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [titleFilter, setTitleFilter] = React.useState("");

  const filters = React.useMemo(
    () => ({
      projectId,
      sort: sorting[0]?.id as keyof Tables<"tasks"> | undefined,
      order: (sorting[0]?.desc ? "desc" : "asc") as "desc" | "asc" | undefined,
    }),
    [projectId, sorting],
  );

  const { data: rawTasks = [] } = useListTasks(filters);
  const { data: members = [] } = useListMembers(projectId);

  // Normalize the tasks data to match our expected type
  const tasks: NormalizedTaskData[] = React.useMemo(() => {
    return rawTasks.map(task => ({
      ...task,
      comments: task.comments?.map(comment => {
        const userProfile = Array.isArray(comment.user)
          ? comment.user[0]
          : comment.user;
        if (!userProfile || !("username" in userProfile)) {
          throw new Error("Invalid user profile format");
        }
        return {
          ...comment,
          user: userProfile as UserProfile,
        };
      }),
    }));
  }, [rawTasks]);

  const handleRowClick = React.useCallback(
    (
      task: NormalizedTaskData,
      event: React.MouseEvent<HTMLTableRowElement>,
    ) => {
      if ((event.target as HTMLElement).closest("button, select")) {
        return;
      }
      router.push(
        configuration.paths.tasks.view({
          project_slug: projectSlug,
          task_slug: task.slug,
        }),
      );
    },
    [router, projectSlug],
  );

  const columnHelper = createColumnHelper<NormalizedTaskData>();

  const copyBranchName = React.useCallback(
    (task: NormalizedTaskData) => {
      const branchName = `${task.project.prefix}-${task.ordinal_id}-${task.slug}`;
      navigator.clipboard.writeText(branchName);
      toast({
        title: "Branch name copied to clipboard",
        description: branchName,
      });
    },
    [toast],
  );

  const columns = [
    columnHelper.accessor("title", {
      id: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-normal">{row.getValue("title")}</span>
      ),
    }),
    // ... rest of the columns remain the same
  ];

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const handleTitleFilterChange = React.useCallback(
    (value: string) => {
      setTitleFilter(value);
      table.getColumn("title")?.setFilterValue(value);
    },
    [table],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter tasks..."
          value={titleFilter}
          onChange={e => handleTitleFilterChange(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={e => handleRowClick(row.original, e)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
