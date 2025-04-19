"use client"

import Link from "next/link"
import { FilePlus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { claimsApi, Claim } from "@/lib/api"

// Client component for fetching and displaying claims
function ClaimsTable({ status }: { status?: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const result = await claimsApi.getClaims(status);
        setClaims(result.claims);
      } catch (err) {
        console.error('Error fetching claims:', err);
        setError('Failed to load claims. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaims();
  }, [status]);
  
  if (loading) {
    return <p className="text-center py-4">Loading claims...</p>;
  }
  
  if (error) {
    return <p className="text-center py-4 text-red-500">{error}</p>;
  }
  
  if (claims.length === 0) {
    return <p className="text-center py-4">No claims found.</p>;
  }
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Get status color for status indicator
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'denied':
        return 'bg-red-500';
      case 'appealed':
        return 'bg-blue-500';
      case 'info-requested':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
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
        {claims.map((claim) => (
          <TableRow key={claim.claimId}>
            <TableCell className="font-medium">{claim.claimId}</TableCell>
            <TableCell>{claim.provider.providerName || 'Unknown Provider'}</TableCell>
            <TableCell>{claim.service.serviceDate ? formatDate(claim.service.serviceDate) : 'N/A'}</TableCell>
            <TableCell>${claim.service.totalCharge || '0.00'}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <span className={`inline-block h-2 w-2 rounded-full ${getStatusColor(claim.status)} mr-2`}></span>
                <span>{claim.status.charAt(0).toUpperCase() + claim.status.slice(1).replace('-', ' ')}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/claims/${claim.claimId}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Use server component as main page
export default function ClaimsPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Claims</h1>
          <p className="text-muted-foreground">View and manage all your mental health insurance claims.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/claims/new">
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
                <Suspense fallback={<p className="text-center py-4">Loading claims...</p>}>
                  <ClaimsTable />
                </Suspense>
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <Suspense fallback={<p className="text-center py-4">Loading claims...</p>}>
                  <ClaimsTable status="pending" />
                </Suspense>
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                <Suspense fallback={<p className="text-center py-4">Loading claims...</p>}>
                  <ClaimsTable status="approved" />
                </Suspense>
              </TabsContent>
              <TabsContent value="denied" className="mt-4">
                <Suspense fallback={<p className="text-center py-4">Loading claims...</p>}>
                  <ClaimsTable status="denied" />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
