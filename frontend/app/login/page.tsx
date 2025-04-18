"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("signup") ? "signup" : "login"
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would implement your login logic
    console.log("Login submitted")
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would implement your signup logic
    console.log("Signup submitted")
  }

  return (
    <div className="container flex h-screen w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[350px]">
        <div className="flex flex-col space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to MindClaim</h1>
          <p className="text-xs text-muted-foreground">
            {activeTab === "login"
              ? "Sign in to manage your mental health claims"
              : "Create an account to start your claim journey"}
          </p>
        </div>

        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Login</CardTitle>
                <CardDescription className="text-xs">Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-3 pb-2">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">
                      Email
                    </Label>
                    <Input id="email" type="email" placeholder="name@example.com" required className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <Input id="password" type="password" required className="h-9" />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button type="submit" className="w-full h-9">
                    Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sign Up</CardTitle>
                <CardDescription className="text-xs">Create your account in under a minute.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-3 pb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="first-name" className="text-xs">
                        First Name
                      </Label>
                      <Input id="first-name" placeholder="John" required className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last-name" className="text-xs">
                        Last Name
                      </Label>
                      <Input id="last-name" placeholder="Doe" required className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs">
                      Email
                    </Label>
                    <Input id="signup-email" type="email" placeholder="name@example.com" required className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs">
                      Password
                    </Label>
                    <Input id="signup-password" type="password" required className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-xs">
                      Confirm Password
                    </Label>
                    <Input id="confirm-password" type="password" required className="h-9" />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button type="submit" className="w-full h-9">
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground">
          <Link href="/help" className="hover:text-primary underline underline-offset-4">
            Need help with your mental health claim?
          </Link>
        </div>
      </div>
    </div>
  )
}
