"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AgentResultCard } from "@/components/agent-result-card";
import { AgentResultDetailModal } from "@/components/agent-result-detail-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw, Settings } from "lucide-react";
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/trpc/routers/_app';
import SuperJSON from 'superjson';

type AgentResult = {
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

// Create TRPC client
const trpcClient = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: '/api/trpc',
            transformer: SuperJSON,
        }),
    ],
});

const Page = () => {
    const [prompt, setPrompt] = useState("");
    const [selectedResult, setSelectedResult] = useState<AgentResult | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsCreating(true);
        try {
            const result = await trpcClient.invoke.mutate({ value: prompt });
            toast.success("AI Agent started! Creating your application...");
            setCurrentRecordId(result.recordId);
            setPrompt(""); // Clear the input
        } catch (error: any) {
            console.error("Invoke error:", error);
            if (error.message?.includes('Rate limit exceeded') || error.message?.includes('TOO_MANY_REQUESTS')) {
                toast.error("⏰ Please wait a moment before creating another AI agent task. This helps prevent overloading the system.");
            } else if (error.message?.includes('Rate limit reached') || error.message?.includes('rate_limit_exceeded')) {
                toast.error("🔄 OpenAI rate limit reached. Your request will be automatically retried with exponential backoff. Please be patient.");
            } else if (error.data?.code === 'TOO_MANY_REQUESTS') {
                toast.error("⏰ Rate limit reached. Please wait 2 minutes before creating another AI agent task.");
            } else {
                toast.error("Failed to start AI Agent: " + (error.message || "Unknown error"));
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleViewDetails = (result: AgentResult) => {
        setSelectedResult(result);
        setDetailModalOpen(true);
    };

    // Simple component to handle the results display
    const ResultsDisplay = () => {
        const [results, setResults] = useState<AgentResult[]>([]);
        const [loading, setLoading] = useState(true);

        const fetchResults = async () => {
            try {
                const data = await trpcClient.getAllResults.query();
                setResults(data as AgentResult[]);
            } catch (error) {
                console.error("Failed to fetch results:", error);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchResults();
            const interval = setInterval(fetchResults, 5000); // Refetch every 5 seconds
            return () => clearInterval(interval);
        }, []);

        const pendingResults = results.filter(r => r.status === 'pending');
        const completedResults = results.filter(r => r.status === 'completed');
        const failedResults = results.filter(r => r.status === 'failed');

        if (loading) {
            return (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            );
        }

        return (
            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">
                        All ({results.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        In Progress ({pendingResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="failed">
                        Failed ({failedResults.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((result: AgentResult) => (
                                <AgentResultCard
                                    key={result.id}
                                    result={result}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No applications created yet. Start by describing what you want to build!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completedResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedResults.map((result: AgentResult) => (
                                <AgentResultCard
                                    key={result.id}
                                    result={result}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No completed applications yet.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {pendingResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingResults.map((result: AgentResult) => (
                                <AgentResultCard
                                    key={result.id}
                                    result={result}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No applications currently in progress.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="failed" className="space-y-4">
                    {failedResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {failedResults.map((result: AgentResult) => (
                                <AgentResultCard
                                    key={result.id}
                                    result={result}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No failed applications.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            AI Code Agent
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
                            Describe what you want to build, and our AI agent will create a complete web application for you.
                        </p>
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('/settings', '_blank')}
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                View Settings & Rate Limits
                            </Button>
                        </div>
                    </div>

                    {/* Rate Limit Info Banner */}
                    <Alert className="mb-8 border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                            <strong>System Info:</strong> The AI agent uses GPT-4o-mini with automatic retry and exponential backoff for OpenAI rate limits. 
                            You can create a maximum of 2 AI agent tasks every 2 minutes to prevent system overload. 
                            If the live preview shows a default Next.js page, the AI may need clearer instructions - try being more specific about what you want to build.
                        </AlertDescription>
                    </Alert>

                    {/* Create New Agent Task */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Create New Application
                            </CardTitle>
                            <CardDescription>
                                Describe what you want to build in natural language
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe what you want to build in detail... 

Examples:
• 'Create a todo app with drag and drop functionality, add/edit/delete tasks, and local storage'
• 'Build a dashboard with charts showing sales data, user analytics, and dark mode toggle'
• 'Make a blog site with article cards, search functionality, and responsive design'
• 'Create a calculator app with a modern UI and keyboard support'

Be specific about features, styling, and functionality you want included."
                                    className="min-h-[120px]"
                                    disabled={isCreating}
                                />
                                <div className="flex gap-2">
                                    <Button 
                                        type="submit" 
                                        disabled={isCreating || !prompt.trim()}
                                        className="flex items-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Create Application
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <ResultsDisplay />
                </div>
            </div>

            <AgentResultDetailModal
                result={selectedResult}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
            />
        </div>
    );
}

export default Page;