import Link from "next/link";
import { Salad, Target, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Set Calorie Goals",
    description:
      "Define your daily calorie and protein targets. Track your progress throughout the day.",
  },
  {
    title: "Daily Menu Updates",
    description:
      "Fresh Foco menu data every day with full nutritional info — calories, protein, carbs, and more.",
  },
  {
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
      <section className="flex max-w-3xl flex-col items-center gap-8 pb-12 pt-8 text-center md:pb-16 md:pt-12 lg:py-24">
        <div className="flex items-center gap-4 animate-fade-in">
          <Salad className="h-14 w-14 text-primary" />
          <h1 className="font-display text-5xl tracking-tight sm:text-6xl md:text-7xl" style={{ textWrap: "balance" }}>
            Foco Diet
            <span className="text-primary"> Planner</span>
          </h1>
        </div>

        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl animate-fade-up" style={{ animationDelay: "0.1s", textWrap: "balance" }}>
          Stop clicking through endless menus. Set your calorie goal and get
          personalized meal suggestions from today&apos;s Foco dining options.
        </p>

        <div className="flex gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">
              Sign In
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="w-full max-w-5xl pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-rows-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {/* Feature 1 — large tile spanning full height on left */}
          <div className="relative overflow-hidden rounded-2xl bg-primary/[0.06] p-8 sm:row-span-2 dark:bg-primary/[0.08]">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl lg:text-3xl">{features[0].title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:text-base">
                  {features[0].description}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 — top-right tile */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:bg-muted/40">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-calories)]/10">
                <Clock className="h-5 w-5" style={{ color: "var(--color-calories)" }} />
              </div>
              <div>
                <h3 className="font-display text-lg">{features[1].title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {features[1].description}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 — bottom-right tile */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:bg-muted/40">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-protein)]/10">
                <TrendingDown className="h-5 w-5" style={{ color: "var(--color-protein)" }} />
              </div>
              <div>
                <h3 className="font-display text-lg">{features[2].title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {features[2].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-3xl pb-20">
        <h2 className="mb-10 text-center font-display text-3xl" style={{ textWrap: "balance" }}>
          How It Works
        </h2>
        <div className="space-y-8">
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
            <div key={item.step} className="flex gap-5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-display text-primary">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
