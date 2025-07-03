"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";


const Page = () => {
    const [value, setValue] = useState("");

    const tprc = useTRPC();
    const invoke = useMutation(tprc.invoke.mutationOptions({
        onSuccess: () => {
            toast.success("Background job started")
        }
    }));

    return (
        <div className="p-4 max-w-8xl mx-auto">
            <Input value={value} onChange={(e) => setValue(e.target.value)}/>
            <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ value: "Carlo made this"})}>
                Invoke Background Job
            </Button> 
        </div>
    );
}

export default Page;