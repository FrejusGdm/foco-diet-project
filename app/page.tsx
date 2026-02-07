import Link from "next/link";
import { Salad, Target, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Set Calorie Goals",
    description:
      "Define your daily calorie and protein targets. Track your progress throughout the day.",
  },
  {
    icon: Clock,
    title: "Daily Menu Updates",
    description:
      "Automated scraping brings you the latest Foco menu every day with full nutritional info.",
  },
  {
    icon: TrendingDown,
    title: "Smart Meal Planning",
    description:
      "Build meal plans that fit your diet. See running totals and stay within your goals.",
  },
];

/**
 * Landing page - shown to unauthenticated users.
 * Presents the value proposition and sign-up CTA.
 */
export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="flex max-w-3xl flex-col items-center gap-6 pb-8 pt-6 text-center md:pb-12 md:pt-10 lg:py-20">
        <div className="flex items-center gap-3">
          <Salad className="h-12 w-12 text-emerald-600" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Foco Diet
            <span className="text-emerald-600"> Planner</span>
          </h1>
        </div>

        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          Stop clicking through endless menus. Set your calorie goal and get
          personalized meal suggestions from today&apos;s Foco dining options.
        </p>

        <div className="flex gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl pb-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-3xl pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">How It Works</h2>
        <div className="space-y-6">
          {[
            {
              step: "1",
              title: "Create your account",
              desc: "Sign up in seconds and set your daily calorie goal.",
            },
            {
              step: "2",
              title: "Browse today's menu",
              desc: "See all Foco breakfast, lunch, and dinner options with calorie counts.",
            },
            {
              step: "3",
              title: "Build your meal plan",
              desc: "Add items to your daily plan and track your progress toward your goal.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
