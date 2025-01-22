"use client";
import { useListTasks, useUpdateTask } from "@/hooks/task.hooks";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, GitBranch, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useDebounce } from "use-debounce";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tables } from "@/types/database.types";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  TaskResult,
  TaskTableProps,
} from "@/types/task.types";

const TaskTable = ({ projectId, projectSlug }: TaskTableProps) => {
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

  // Create raw filters object
  const rawFilters = React.useMemo(
    () => ({
      projectSlug,
      sort: sorting[0]?.id as keyof Tables<"tasks"> | undefined,
      order: (sorting[0]?.desc ? "desc" : "asc") as "desc" | "asc" | undefined,
    }),
    [projectSlug, sorting],
  );

  // Debounce the filters
  const [debouncedFilters] = useDebounce(rawFilters, 300);

  const { data: tasks = [] } = useListTasks(debouncedFilters);
  const { data: members = [] } = useListMembers(projectId);

  const handleRowClick = React.useCallback(
    (task: TaskResult, event: React.MouseEvent<HTMLTableRowElement>) => {
      if ((event.target as HTMLElement).closest("button, select")) {
        return;
      }
      router.push(
        configuration.paths.tasks.view({
          project_slug: projectSlug,
          task_slug: task.task.slug,
        }),
      );
    },
    [router, projectSlug],
  );

  const copyBranchName = React.useCallback(
    (task: TaskResult) => {
      const branchName = `${task.project?.prefix}-${task.task.ordinal_id}-${task.task.slug}`;
      navigator.clipboard.writeText(branchName);
      toast({
        title: "Branch name copied to clipboard",
        description: branchName,
      });
    },
    [toast],
  );

  const columns = React.useMemo<ColumnDef<TaskResult>[]>(
    () => [
      {
        id: "title",
        accessorFn: row => row.task.title,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Title
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-normal">{row.getValue("title")}</span>
        ),
      },
      {
        id: "status",
        accessorFn: row => row.task.status,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Status
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Select
            value={row.getValue("status")}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { status: value as Tables<"tasks">["status"] },
              });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>
                  {status.toLowerCase().replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "priority",
        accessorFn: row => row.task.priority,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Priority
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Select
            value={row.getValue("priority")}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { priority: value as Tables<"tasks">["priority"] },
              });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "assignee",
        accessorFn: row => row.assignee_profile?.display_name ?? "",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Assignee
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Select
            value={row.original.task.assignee || "unassigned"}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { assignee: value === "unassigned" ? null : value },
              });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {row.original.assignee_profile ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={
                          row.original.assignee_profile.avatar_url || undefined
                        }
                      />
                      <AvatarFallback>
                        {row.original.assignee_profile.display_name?.charAt(
                          0,
                        ) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {row.original.assignee_profile.display_name ||
                        "Unnamed User"}
                    </span>
                  </div>
                ) : (
                  "Unassigned"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map(member => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={member.profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {member.profile?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {member.profile?.display_name || "Unnamed User"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "branch",
        accessorFn: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              copyBranchName(row.original);
            }}
            className="h-8 w-8"
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [updateTask, members, copyBranchName],
  );

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
      <div className="flex items-center justify-between gap-4">
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
        <Button
          onClick={() =>
            router.push(
              configuration.paths.tasks.new({ project_slug: projectSlug }),
            )
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
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
};

export default TaskTable;
