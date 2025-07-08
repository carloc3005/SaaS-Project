"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface AgentResultDetailModalProps {
  result: {
    id: string;
    eventId: string;
    url: string | null;
    title: string | null;
    files: any;
    summary: string | null;
    prompt: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentResultDetailModal({ result, open, onOpenChange }: AgentResultDetailModalProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!result) return null;

  const getStatusIcon = () => {
    switch (result.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const copyToClipboard = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      toast.success(`Copied ${fileName} to clipboard`);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const files = result.files ? (typeof result.files === 'object' ? result.files : {}) : {};
  const fileEntries = Object.entries(files);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {result.title || "Agent Result Details"}
            </DialogTitle>
            <Badge className={getStatusColor()}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {result.status}
              </div>
            </Badge>
          </div>
          <DialogDescription>
            Created {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files ({fileEntries.length})</TabsTrigger>
            <TabsTrigger value="logs">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{result.prompt}</p>
              </CardContent>
            </Card>

            {result.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            {result.url && result.status === "completed" && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    View the generated application in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(result.url!, "_blank")}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Live Preview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {fileEntries.length > 0 ? (
                <div className="space-y-4">
                  {fileEntries.map(([fileName, content]) => (
                    <Card key={fileName}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-mono">{fileName}</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(String(content), fileName)}
                            className="flex items-center gap-1"
                          >
                            {copiedFile === fileName ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedFile === fileName ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                            <code>{String(content)}</code>
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files generated</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Event ID:</span>
                    <p className="font-mono text-xs break-all">{result.eventId}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Record ID:</span>
                    <p className="font-mono text-xs break-all">{result.id}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Created:</span>
                    <p>{new Date(result.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Updated:</span>
                    <p>{new Date(result.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
