import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
    const { user, isLoading } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [codeRequested, setCodeRequested] = useState(false);

    useEffect(() => {
        if (!isLoading && user) {
            setLocation("/home");
        }
    }, [isLoading, user, setLocation]);

    const requestCodeMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/auth/request-code", { email });
            return response.json();
        },
        onSuccess: () => {
            setCodeRequested(true);
            toast({ title: "Code sent", description: "Check your email for your 6-digit sign-in code." });
        },
        onError: (error: Error) => {
            toast({ title: "Could not send code", description: error.message, variant: "destructive" });
        },
    });

    const verifyCodeMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/auth/verify-code", { email, code });
            return response.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/home");
        },
        onError: (error: Error) => {
            toast({ title: "Invalid code", description: error.message, variant: "destructive" });
        },
    });

    const handleRequestCode = (event: FormEvent) => {
        event.preventDefault();
        requestCodeMutation.mutate();
    };

    const handleVerifyCode = (event: FormEvent) => {
        event.preventDefault();
        verifyCodeMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
            <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
                <div className="text-center">
                    <img src="/city-discoverer-logo-nobg.png" alt="Daily Felix" className="h-16 mx-auto mb-3" />
                    <h1 className="text-2xl font-bold">Sign In / Get Started</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Enter your email and we will send a one-time sign-in code.
                    </p>
                </div>

                <form onSubmit={handleRequestCode} className="space-y-3">
                    <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        data-testid="input-auth-email"
                    />
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={requestCodeMutation.isPending}
                        data-testid="button-request-code"
                    >
                        {requestCodeMutation.isPending ? "Sending..." : "Send Sign-In Code"}
                    </Button>
                </form>

                {codeRequested && (
                    <form onSubmit={handleVerifyCode} className="space-y-3">
                        <Input
                            type="text"
                            value={code}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6-digit code"
                            required
                            data-testid="input-auth-code"
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={verifyCodeMutation.isPending}
                            data-testid="button-verify-code"
                        >
                            {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}