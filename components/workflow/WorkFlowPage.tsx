"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import useDemoData from "@/hooks/useDemoData";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface File {
  id: string;
  name: string;
}

interface FileListProps {
  files: File[];
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  onFileSelect,
}) => (
  <div className="space-y-2">
    {files.map(file => (
      <div
        key={file.id}
        className={cn(
          "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
          selectedFiles.includes(file.id) && "bg-blue-50 dark:bg-blue-900",
        )}
        onClick={() => onFileSelect(file.id)}
      >
        <Checkbox
          checked={selectedFiles.includes(file.id)}
          onCheckedChange={() => onFileSelect(file.id)}
        />
        <span className="flex-1 text-sm">{file.name}</span>
      </div>
    ))}
  </div>
);

const WorkFlowPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const { project } = useDemoData();
  const tasks = project?.tasks;

  const mockFiles: File[] = [
    { id: "1", name: "index.html" },
    { id: "2", name: "styles.css" },
    { id: "3", name: "app.js" },
    { id: "4", name: "README.md" },
  ];

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleSubmit = () => {
    console.log("Commit message:", commitMessage);
    console.log("Selected files:", selectedFiles);
  };

  return (
    <div className="flex gap-6 h-full w-full">
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter commit message..."
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!commitMessage.trim() || selectedFiles.length === 0}
          >
            Submit Changes
          </Button>
        </div>

        <div className="space-y-2">
          {tasks?.map(task => (
            <Card key={task.id} className="p-4">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">
                {task.description || "No description"}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-1/3">
        <FileList
          files={mockFiles}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
};

export default WorkFlowPage;
