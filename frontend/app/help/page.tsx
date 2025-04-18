import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Mail, MessageSquare, Phone } from "lucide-react"

export default function HelpCenterPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">We're here to support you through your mental health claim journey.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Frequently Asked Questions",
            description: "Find answers about coverage, claims process, and more.",
            icon: <MessageSquare className="h-6 w-6" />,
            href: "/help/faq",
          },
          {
            title: "Contact Support",
            description: "Our empathetic team is ready to help with your questions.",
            icon: <Mail className="h-6 w-6" />,
            href: "/help/contact",
          },
          {
            title: "Call Us",
            description: "Sometimes it's easier to talk. We're just a phone call away.",
            icon: <Phone className="h-6 w-6" />,
            href: "/help/phone",
          },
        ].map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {item.icon}
                <CardTitle>{item.title}</CardTitle>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={item.href}>
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">Popular Topics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Understanding Coverage",
            "Filing a New Claim",
            "Required Documentation",
            "Privacy & Security",
            "Claim Status Updates",
            "Getting Human Support",
          ].map((topic, index) => (
            <Link
              key={index}
              href={`/help/topics/${topic.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
