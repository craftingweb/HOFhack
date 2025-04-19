import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronRight,
  Shield,
  FileText,
  MessageCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 text-lg font-medium">
            <Link href="/" className="font-bold">
              AppealRX
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                href="#features"
                className="transition-colors hover:text-foreground/80"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="transition-colors hover:text-foreground/80"
              >
                How It Works
              </Link>
              <Link
                href="#about"
                className="transition-colors hover:text-foreground/80"
              >
                About
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="api/auth/login?returnTo=/dashboard"
              className="text-sm font-medium"
            >
              Login
            </Link>
            <Button asChild>
              <Link href="/login?signup=true">Sign Up</Link>
            </Button>
            <Link
              href="/help"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Get the mental health support you deserve without the
                    paperwork stress
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Your claims, simplified by AI
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Link href="/login?signup=true">
                      Start My Claim <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#features">See What's Covered</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Filing a mental health claim shouldn't feel overwhelming
                  <br />
                  We make it simple, secure, and supportive
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-muted md:h-[400px]">
                  <img
                    src="/heroImage.jpg?height=400&width=600"
                    alt="Person feeling relieved while using MindClaim"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How We Help
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We understand mental health isn't just another checkbox. Our
                  tool is designed with empathy in mind.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-center">
                  Understand your coverage
                </h3>
                <p className="text-center text-muted-foreground">
                  Our AI explains what's covered in plain language — no jargon.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <ChevronRight className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-center">
                  Guided step-by-step filing
                </h3>
                <p className="text-center text-muted-foreground">
                  Answer a few easy questions. We'll handle the rest.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-center">
                  Human help, when you need it
                </h3>
                <p className="text-center text-muted-foreground">
                  Chat with real people if you get stuck — we've got your back.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Three simple steps to get the support you deserve
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Check Eligibility",
                  description:
                    "Answer a few questions to see what's covered under your plan.",
                },
                {
                  step: "2",
                  title: "Upload Documents",
                  description:
                    "Securely share your information—we'll guide you through what's needed.",
                },
                {
                  step: "3",
                  title: "Submit & Track",
                  description:
                    "We'll handle the paperwork and keep you updated every step of the way.",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="relative flex flex-col items-center space-y-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xl">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-center text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Link href="/login?signup=true">Check My Eligibility</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Your privacy matters
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    Your information is encrypted and only used to process your
                    claim
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                  <div>
                    <h3 className="font-bold">Built for sensitivity</h3>
                    <p className="text-sm text-muted-foreground">
                      We understand mental health isn't just another checkbox.
                      Our tool is designed with empathy in mind.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4 rounded-xl border bg-background p-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Ready to get started?</h3>
                  <p className="text-muted-foreground">
                    It only takes a few minutes to begin your claim process.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Link href="/login?signup=true">Get Help Now</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/help">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 bg-muted/20">
        <div className="container flex flex-col items-center justify-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Made with ❤️ @{" "}
            <a
              href="https://hofcapital.com/"
              target="_blank"
              className=" hover:text-green-700"
            >
              HOF
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
