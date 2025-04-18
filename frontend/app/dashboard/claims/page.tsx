import Link from "next/link"
import { FilePlus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ClaimsPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Claims</h1>
          <p className="text-muted-foreground">View and manage all your mental health insurance claims.</p>
        </div>
        <Button asChild>
          <Link href="/claims/new">
            <FilePlus className="mr-2 h-4 w-4" />
            New Claim
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims Management</CardTitle>
          <CardDescription>Track the status of your submitted claims and manage your reimbursements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search claims..." className="pl-8" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Claims</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Claims</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="denied">Denied</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0412</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Apr 12, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                          <span>Pending</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0412">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0405</TableCell>
                      <TableCell>Dr. Johnson</TableCell>
                      <TableCell>Apr 5, 2025</TableCell>
                      <TableCell>$225.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                          <span>Info Requested</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0405">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0328</TableCell>
                      <TableCell>Wellness Center</TableCell>
                      <TableCell>Mar 28, 2025</TableCell>
                      <TableCell>$75.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                          <span>Denied</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0328">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0315</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Mar 15, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Approved</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0315">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0301</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Mar 1, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Approved</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0301">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0412</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Apr 12, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                          <span>Pending</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0412">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0405</TableCell>
                      <TableCell>Dr. Johnson</TableCell>
                      <TableCell>Apr 5, 2025</TableCell>
                      <TableCell>$225.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                          <span>Info Requested</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0405">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0315</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Mar 15, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Approved</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0315">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0301</TableCell>
                      <TableCell>Dr. Smith</TableCell>
                      <TableCell>Mar 1, 2025</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Approved</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0301">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="denied" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">MH-2025-0328</TableCell>
                      <TableCell>Wellness Center</TableCell>
                      <TableCell>Mar 28, 2025</TableCell>
                      <TableCell>$75.00</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                          <span>Denied</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/claims/MH-2025-0328">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
