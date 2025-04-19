import Link from "next/link"
import { ArrowRight, FileCheck, FilePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Page() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your mental health insurance claims.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/claims/new">
            <FilePlus className="mr-2 h-4 w-4" />
            New Claim
          </Link>
        </Button>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Claims</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">-2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reimbursed</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,254.36</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription>Your most recent insurance claims and their status.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Therapy Session - Dr. Smith</p>
                      <p className="text-sm text-muted-foreground">Submitted on April 12, 2025</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        <span className="text-sm">Approved</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Psychiatrist - Dr. Johnson</p>
                      <p className="text-sm text-muted-foreground">Submitted on April 5, 2025</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                        <span className="text-sm">Pending</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Group Therapy - Wellness Center</p>
                      <p className="text-sm text-muted-foreground">Submitted on March 28, 2025</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                        <span className="text-sm">Denied</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/claims">View All Claims</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Coverage Summary</CardTitle>
                <CardDescription>Your current mental health benefits usage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Therapy Sessions</div>
                    <div className="font-medium">12/20 used</div>
                  </div>
                  <Progress value={60} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Psychiatrist Visits</div>
                    <div className="font-medium">4/8 used</div>
                  </div>
                  <Progress value={50} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Annual Deductible</div>
                    <div className="font-medium">$750/$1000</div>
                  </div>
                  <Progress value={75} />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/coverage">View Coverage Details</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Claims</CardTitle>
              <CardDescription>Track and manage your active insurance claims.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
                <div className="flex items-center justify-between p-4">
                  <div className="grid gap-1">
                    <div className="font-semibold">Therapy Session - Dr. Smith</div>
                    <div className="text-sm text-muted-foreground">Claim #MH-2025-0412</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                      <span className="text-sm">In Review</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>Submitted: April 12, 2025</span>
                      <span>•</span>
                      <span>Amount: $150.00</span>
                    </div>
                    <div className="text-muted-foreground">Expected response by April 26, 2025</div>
                  </div>
                </div>
              </div>
              <div className="rounded-md border">
                <div className="flex items-center justify-between p-4">
                  <div className="grid gap-1">
                    <div className="font-semibold">Psychiatrist - Dr. Johnson</div>
                    <div className="text-sm text-muted-foreground">Claim #MH-2025-0405</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                      <span className="text-sm">Additional Info Requested</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>Submitted: April 5, 2025</span>
                      <span>•</span>
                      <span>Amount: $225.00</span>
                    </div>
                    <div className="text-red-500 font-medium">Action required by April 20, 2025</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/claims">View All Claims</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Insurance Resources</CardTitle>
              <CardDescription>Helpful guides and information about mental health insurance coverage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Understanding Mental Health Parity</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Learn about your rights under the Mental Health Parity and Addiction Equity Act.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/resources/parity">Read Guide</Link>
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Common Claim Denial Reasons</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Understand why claims get denied and how to successfully appeal them.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/resources/denials">Read Guide</Link>
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Documentation Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      How to properly document and submit mental health claims for maximum reimbursement.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/resources/documentation">Read Guide</Link>
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Insurance Terminology</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Decode complex insurance terms and understand what they mean for your coverage.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/resources/terminology">Read Guide</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
