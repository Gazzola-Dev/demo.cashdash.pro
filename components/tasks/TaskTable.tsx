import { useListTasks, useUpdateTask } from "@/hooks/task.hooks";
import { TaskWithDetails } from "@/types/task.types";
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
import { ArrowUpDown, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

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

  const { data: tasks = [] } = useListTasks(filters);
  const { data: members = [] } = useListMembers(projectId);

  const handleRowClick = React.useCallback(
    (task: TaskWithDetails, event: React.MouseEvent<HTMLTableRowElement>) => {
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

  const copyBranchName = React.useCallback(
    (task: TaskWithDetails) => {
      const branchName = `${task.project.prefix}-${task.ordinal_id}-${task.slug}`;
      navigator.clipboard.writeText(branchName);
      toast({
        title: "Branch name copied to clipboard",
        description: branchName,
      });
    },
    [toast],
  );

  type Column = ColumnDef<TaskWithDetails>;

  const columns = React.useMemo<Column[]>(
    () => [
      {
        id: "title",
        accessorFn: row => row.title,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Title
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-normal">{row.getValue("title")}</span>
        ),
      },
      {
        id: "status",
        accessorFn: row => row.status,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Select
            value={row.getValue("status")}
            onValueChange={value => {
              updateTask({
                id: row.original.id,
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
        accessorFn: row => row.priority,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Select
            value={row.getValue("priority")}
            onValueChange={value => {
              updateTask({
                id: row.original.id,
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assignee
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Select
            value={row.original.assignee || ""}
            onValueChange={value => {
              updateTask({
                id: row.original.id,
                updates: { assignee: value || null },
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
              <SelectItem value="">Unassigned</SelectItem>
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
