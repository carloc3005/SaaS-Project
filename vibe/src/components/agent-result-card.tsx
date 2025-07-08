"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentResultCardProps {
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
  };
  onViewDetails?: (result: any) => void;
}

export function AgentResultCard({ result, onViewDetails }: AgentResultCardProps) {
  const getStatusIcon = () => {
    switch (result.status) {
      case "completed":
        // Check if this is a failed page replacement
        if (result.title?.includes("Default Page") || result.title?.includes("⚠️")) {
          return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        }
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
        // Check if this is a failed page replacement
        if (result.title?.includes("Default Page") || result.title?.includes("⚠️")) {
          return "bg-orange-100 text-orange-800";
        }
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const fileCount = result.files ? Object.keys(result.files).length : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {result.title || "Untitled"}
          </CardTitle>
          <Badge className={getStatusColor()}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {result.status}
            </div>
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {result.prompt}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {result.summary && (
          <div>
            <p className="text-sm text-gray-600 line-clamp-3">{result.summary}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {fileCount} files
          </div>
          <div>
            {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          {result.url && result.status === "completed" && !result.title?.includes("Default Page") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(result.url!, "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails?.(result)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Details
          </Button>
        </div>
        
        {(result.title?.includes("Default Page") || result.title?.includes("⚠️")) && (
          <div className="w-full text-xs text-orange-600 bg-orange-50 p-2 rounded border">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Live preview may show default Next.js page. Check details for generated files.
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
