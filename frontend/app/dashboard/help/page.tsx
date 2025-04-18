"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DashboardShell } from "@/components/dashboard-shell"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function HelpCenterPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your MindClaim assistant. How can I help you with your mental health insurance claims today?",
    },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }])
      // Here you would typically send the input to your backend for processing
      // For this example, we'll just simulate a response
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content:
              "Thank you for your question. I'm here to help with any inquiries about mental health insurance claims. Could you please provide more details about your specific concern?",
          },
        ])
      }, 1000)
      setInput("")
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">
            Get assistance with your mental health insurance claims and coverage questions.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions about mental health insurance claims.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">How do I submit a new claim?</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to the "New Claim" section and follow the step-by-step process to submit your claim.
                </p>
              </div>
              <div>
                <h3 className="font-medium">What documents do I need for a claim?</h3>
                <p className="text-sm text-muted-foreground">
                  Typically, you'll need a receipt or superbill from your provider, and any relevant medical records.
                </p>
              </div>
              <div>
                <h3 className="font-medium">How long does claim processing take?</h3>
                <p className="text-sm text-muted-foreground">
                  Most claims are processed within 30 days, but it can vary depending on the complexity of the claim.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All FAQs
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat with Our Assistant</CardTitle>
              <CardDescription>Get real-time help with your insurance questions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-[300px] overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`rounded-lg p-2 max-w-[80%] ${
                        message.role === "user" ? "bg-teal-600 text-white" : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
