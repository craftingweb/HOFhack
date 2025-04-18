import Link from "next/link"
import { BookOpen, FileText, HelpCircle, Info, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard-shell"

export default function ResourcesPage() {
  const resources = [
    {
      title: "Understanding Mental Health Parity",
      description: "Learn about your rights under the Mental Health Parity and Addiction Equity Act.",
      icon: Shield,
      href: "/resources/parity",
      category: "Legal Rights",
    },
    {
      title: "Common Claim Denial Reasons",
      description: "Understand why claims get denied and how to successfully appeal them.",
      icon: Info,
      href: "/resources/denials",
      category: "Claims Help",
    },
    {
      title: "Documentation Guide",
      description: "How to properly document and submit mental health claims for maximum reimbursement.",
      icon: FileText,
      href: "/resources/documentation",
      category: "Claims Help",
    },
    {
      title: "Insurance Terminology",
      description: "Decode complex insurance terms and understand what they mean for your coverage.",
      icon: BookOpen,
      href: "/resources/terminology",
      category: "Education",
    },
    {
      title: "Finding In-Network Providers",
      description: "Tips for finding mental health providers that are covered by your insurance.",
      icon: HelpCircle,
      href: "/resources/providers",
      category: "Provider Help",
    },
    {
      title: "Appeals Process Guide",
      description: "Step-by-step guide to appealing denied mental health insurance claims.",
      icon: FileText,
      href: "/resources/appeals",
      category: "Claims Help",
    },
  ]

  return (
    <DashboardShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Educational resources to help you navigate mental health insurance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-teal-100 p-2 text-teal-700">
                  <resource.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-muted-foreground">{resource.category}</div>
              </div>
              <CardTitle className="mt-3 text-lg">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={resource.href}>Read Guide</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </DashboardShell>
  )
}
