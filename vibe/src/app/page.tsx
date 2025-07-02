"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";


const Page = async () => {
    const tprc = useTRPC();
    const invoke = useMutation(tprc.invoke.mutationOptions({
        onSuccess: () => {
            toast.success("Background job started")
        }
    }));

    return (
        <div className="p-4 max-w-8xl mx-auto">
            <Button disabled={invoke.isPending} onClick={() => invoke.mutate({text: "Carlo made this"})}>
                Invoke Background Job
            </Button>
        </div>
    );
}

export default Page;