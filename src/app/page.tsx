import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]"> {/* Adjust min-height based on header height */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground">
                    Track Your Strength Journey with LiftBuddy
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Record your body measurements, visualize your progress, and stay motivated on your weightlifting path. Simple, elegant, and effective.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/600/400"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="weightlifting fitness gym"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Progress</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  LiftBuddy provides the essential tools for tracking your physical changes and visualizing your hard work.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-12">
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">Measurement Tracking</h3>
                <p className="text-sm text-muted-foreground">Log weight, body fat, and various circumference measurements easily.</p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">Progress Visualization</h3>
                <p className="text-sm text-muted-foreground">See your progress over time with interactive charts for each metric.</p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">BMI Calculation</h3>
                <p className="text-sm text-muted-foreground">Automatically calculate your Body Mass Index based on your height and weight.</p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">Secure Authentication</h3>
                <p className="text-sm text-muted-foreground">Your data is safe with Firebase Authentication (Google & Email).</p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">Responsive Design</h3>
                <p className="text-sm text-muted-foreground">Access LiftBuddy seamlessly on your phone, tablet, or laptop.</p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold">Motivational Feedback</h3>
                <p className="text-sm text-muted-foreground">Get visual cues (green/red) for positive or negative changes.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
       <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} LiftBuddy. All rights reserved.</p>
        {/* Add footer links if needed */}
      </footer>
    </div>
  );
}
