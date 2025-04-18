import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
            <div>
              <Skeleton className="h-10 w-[300px] mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
