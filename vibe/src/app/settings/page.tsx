"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Clock, Zap, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Agent Settings
            </h1>
            <p className="text-gray-600">
              Configuration and rate limiting information for the AI Agent system.
            </p>
          </div>

          {/* Rate Limiting Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Rate Limiting Protection
              </CardTitle>
              <CardDescription>
                Built-in protections to prevent hitting OpenAI rate limits and ensure system stability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">User Request Limit</p>
                    <p className="text-sm text-blue-700">Maximum requests per user</p>
                  </div>
                  <Badge variant="secondary">2 per 2 minutes</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Auto Retry</p>
                    <p className="text-sm text-green-700">Automatic retry on rate limits</p>
                  </div>
                  <Badge variant="secondary">3 attempts</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-900">Request Queue</p>
                    <p className="text-sm text-purple-700">Delay between requests</p>
                  </div>
                  <Badge variant="secondary">3 seconds</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-orange-900">Model Used</p>
                    <p className="text-sm text-orange-700">Higher rate limit model</p>
                  </div>
                  <Badge variant="secondary">GPT-4o-mini</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Current Configuration
              </CardTitle>
              <CardDescription>
                Active settings for the AI Agent system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">AI Model</span>
                  <Badge>GPT-4o-mini</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Max Network Iterations</span>
                  <Badge variant="outline">6</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Temperature Setting</span>
                  <Badge variant="outline">0.1 (More Consistent)</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Sandbox Environment</span>
                  <Badge variant="outline">Next.js 15.3.3 + E2B</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips for Avoiding Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Tips to Avoid Rate Limits
              </CardTitle>
              <CardDescription>
                Best practices for using the AI Agent system efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Wait Between Requests</p>
                    <p className="text-sm text-gray-600">
                      Allow at least 2-3 minutes between creating new AI agent tasks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Be Specific in Prompts</p>
                    <p className="text-sm text-gray-600">
                      Clear, detailed prompts help the AI complete tasks more efficiently with fewer iterations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Monitor System Status</p>
                    <p className="text-sm text-gray-600">
                      Check the status of running tasks before creating new ones to avoid duplicate requests.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
