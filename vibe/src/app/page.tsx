"use client";

import { Button } from "@/components/ui/button";


const Page = async () => {

    return (
        <div className="p-4 max-w-8xl mx-auto">
            <Button>
                Invoke Background Job
            </Button>
        </div>
    );
}

export default Page;