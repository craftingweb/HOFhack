'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard immediately
    router.push('/dashboard');
  }, [router]);
  
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <h1 className="text-xl font-semibold">Redirecting to dashboard...</h1>
        <p className="text-sm text-muted-foreground">You will be redirected automatically</p>
      </div>
    </div>
  );
} 