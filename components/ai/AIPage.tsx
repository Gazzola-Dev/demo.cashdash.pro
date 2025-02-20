"use client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import useDemoData from "@/hooks/useDemoData";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
enum Tab {
  Prompt = "prompt",
  Response = "response",
}
interface MockFiles {
  id: string;
  name: string;
}

// PromptTab Component
const PromptTab = ({
  onToggleTab,
}: {
  onToggleTab: (tab?: Tab | null) => void;
}) => {
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<MockFiles[]>([]);
  const { project } = useDemoData();
  const tasks = project?.tasks;
  const onSubmit = (message: string) => {
    onToggleTab();
  };

  const mockFiles: MockFiles[] = [
    { id: "1", name: "index.html" },
    { id: "2", name: "styles.css" },
    { id: "3", name: "app.js" },
    { id: "4", name: "README.md" },
  ];

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.some(f => f.id === fileId)
        ? prev.filter(f => f.id !== fileId)
        : [...prev, mockFiles.find(f => f.id === fileId)!],
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(commitMessage);
    }
  };

  return (
    <div className="flex gap-6 h-full w-full">
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your prompt..."
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-2">
          {tasks
            ?.map(t => t.task)
            .map(task => (
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
        <div className="space-y-2">
          {mockFiles.map(file => (
            <div
              key={file.id}
              className={cn(
                "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                selectedFiles.some(f => f.id === file.id) &&
                  "bg-blue-50 dark:bg-blue-900",
              )}
              onClick={() => handleFileSelect(file.id)}
            >
              <Checkbox
                checked={selectedFiles.some(f => f.id === file.id)}
                onCheckedChange={() => handleFileSelect(file.id)}
              />
              <span className="flex-1 text-sm">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ResponseTab Component
const ResponseTab = ({
  onToggleTab,
}: {
  onToggleTab: (tab?: Tab | null) => void;
}) => {
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const sampleCode = `function greet(name) {
  return \`Hello, \${name}!\`;
}

// Example usage
console.log(greet("World"));`;

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50}>
        <div className="h-full p-4">
          {progress < 100 ? (
            <Progress value={progress} className="w-full" />
          ) : (
            <div className="prose dark:prose-invert">
              <p>
                This function takes a name parameter and returns a greeting
                message using template literals.
              </p>
            </div>
          )}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="h-full bg-muted p-4 font-mono">
          {progress === 100 && (
            <pre className="whitespace-pre-wrap">{sampleCode}</pre>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

// Main WorkFlowPage Component
const WorkFlowPage = () => {
  const [activeTab, setActiveTab] = useState(Tab.Prompt);

  const onToggleTab = (tab?: Tab | null) =>
    setActiveTab(prev =>
      tab != null ? tab : prev === Tab.Prompt ? Tab.Response : Tab.Prompt,
    );

  return (
    <div className="h-[calc(100vh-8rem)] w-full p-4">
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as Tab)}
        className="h-full"
      >
        <TabsList>
          <TabsTrigger value={Tab.Prompt}>Prompt</TabsTrigger>
          <TabsTrigger value={Tab.Response}>Response</TabsTrigger>
        </TabsList>
        <div className="mt-4 h-[calc(100%-3rem)]">
          <TabsContent value={Tab.Prompt} className="h-full m-0">
            <PromptTab onToggleTab={onToggleTab} />
          </TabsContent>
          <TabsContent value={Tab.Response} className="h-full m-0">
            <ResponseTab onToggleTab={onToggleTab} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default WorkFlowPage;
