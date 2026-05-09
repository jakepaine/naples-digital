// The 30-day playbook structure — adapted from Saraev's MakerSchool
// month-1 (scripts/makerschool/daily_playbook.md). Every step that has a
// Naples module backing it is annotated with `module_key` so the UI can
// link directly into the right tool.
//
// Step keys are stable (used as primary identifiers in
// onboarding_step_completions). Day numbers are 1-indexed.

import type { ModuleKey } from "@naples/db";

export interface PlaybookStep {
  /** Stable identifier — appears in DB. Format: "day-<n>.<slug>". */
  key: string;
  title: string;
  /** One-sentence operator-facing explanation of why this step matters. */
  why: string;
  /** Estimated time in minutes. */
  minutes: number;
  /** Naples module that automates / hosts this step (if any). */
  module_key?: ModuleKey;
  /** Naples app slug for direct deep-link, when different from module's app. */
  app?: string;
  /**
   * If true, this step is intentionally manual — Saraev teaches it as
   * deliberately human (sales calls, community engagement, retros).
   * The UI surfaces "this stays human" to set expectations.
   */
  manual: boolean;
  /** Optional copy-pasteable resource — sheet, doc, template URL. */
  resource_url?: string;
  /** Source lesson id from the corpus, when traceable. */
  corpus_ref?: string;
}

export interface PlaybookDay {
  day: number;
  title: string;
  goal: string;
  /** Total minutes — sum of step minutes, kept here for sticker pricing. */
  total_minutes: number;
  steps: PlaybookStep[];
  /** Optional anchor note (e.g. "no days off, this is the actual job"). */
  reminder?: string;
}

// Helper to compute total minutes from steps.
function withTotals(day: Omit<PlaybookDay, "total_minutes">): PlaybookDay {
  return {
    ...day,
    total_minutes: day.steps.reduce((acc, s) => acc + s.minutes, 0),
  };
}

export const PLAYBOOK: PlaybookDay[] = [
  withTotals({
    day: 1,
    title: "Setup foundations",
    goal: "Name the business, lock the domain, start cold-email warmup.",
    steps: [
      {
        key: "day-1.choose-name",
        title: "Choose your operating name",
        why: "5 minutes max — Saraev says people waste days here. Don't.",
        minutes: 30,
        manual: true,
        resource_url: "https://namelix.com/",
      },
      {
        key: "day-1.buy-domain",
        title: "Buy the main domain + Google Workspace email",
        why: "Foundation for the email send. Workspace Business Starter ($8/mo) is fine.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-1.cold-email-setup",
        title: "Set up sending mailboxes + start warmup",
        why: "Warmup takes 21 days. Start the clock today so you can send Day 22.",
        minutes: 90,
        module_key: "outreach",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 2,
    title: "Niche, portfolio, Upwork profile",
    goal: "Pick 3 niches, build 3 case studies, create Upwork profile.",
    steps: [
      {
        key: "day-2.case-studies",
        title: "Build 3 case studies",
        why: "Format: 'I did X for Y by doing Z'. Three is the minimum.",
        minutes: 90,
        manual: true,
      },
      {
        key: "day-2.pick-niches",
        title: "Pick 3 niches to test",
        why: "Three in parallel = fastest signal on which one converts.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-2.upwork-profile",
        title: "Create your Upwork profile",
        why: "Upwork leads have already decided to buy — you're choosing who.",
        minutes: 60,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 3,
    title: "Upwork application engine + communities",
    goal: "Build a reusable Upwork app template, join 3 communities, dry-run 5 video apps.",
    steps: [
      {
        key: "day-3.upwork-template",
        title: "Build your Upwork application template",
        why: "Templates save hours. Never write a fresh app from scratch.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-3.join-communities",
        title: "Join 3 niche-related communities (Skool/Discord)",
        why: "Communities are warm-lead reservoirs. Paid > free for signal density.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-3.dry-run-loom",
        title: "Dry-run 5 Upwork video applications via Loom",
        why: "Apps use video walkthroughs (Loom), not text. Practice before live.",
        minutes: 60,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 4,
    title: "First contact with customers",
    goal: "Send 10 real Upwork applications. Memorize the sales script.",
    steps: [
      {
        key: "day-4.send-10-apps",
        title: "Send 10 real Upwork applications",
        why: "Apply immediately after job posts — conversion drops with time.",
        minutes: 90,
        manual: true,
      },
      {
        key: "day-4.memorize-sales",
        title: "Memorize the discovery-call sales skeleton",
        why: "Rapport → schedule → why-me/why-now/why-this. Same shape every call.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-4.set-up-recording",
        title: "Set up call recording (Fireflies / Fathom)",
        why: "Reviewing recordings is 3-4× faster skill development than not.",
        minutes: 15,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 5,
    title: "Engagement + first proposal template",
    goal: "Stay active in communities. Build your proposal template.",
    steps: [
      {
        key: "day-5.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Daily volume is the engine.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-5.community-engage",
        title: "Engage 5 minutes per community (real comments, not likes)",
        why: "Real engagement compounds. AI-generated comments get detected.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-5.proposal-template",
        title: "Set up the proposal generator with your template",
        why: "Proposal goes after the discovery call. Naples drafts it from CRM context.",
        minutes: 60,
        module_key: "proposal_generator",
        manual: false,
      },
      {
        key: "day-5.community-post",
        title: "Write your first community post",
        why: "Value-first, never self-promote. 5 posts per community over the month.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 6,
    title: "Stripe + community cycle",
    goal: "Payment infra ready before first close. Second community post.",
    steps: [
      {
        key: "day-6.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Same rhythm.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-6.connect-stripe",
        title: "Connect your Stripe account to Naples",
        why: "Lead-Won → Invoice fires automatically once Stripe is wired.",
        minutes: 15,
        module_key: "lead_won_invoice",
        manual: false,
      },
      {
        key: "day-6.community-post",
        title: "Write community post #2",
        why: "Cadence keeps you visible without being spammy.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 7,
    title: "Wrap week 1",
    goal: "Third community post. Lifestyle audit.",
    steps: [
      {
        key: "day-7.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Ten per day until Day 17.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-7.community-post",
        title: "Write community post #3",
        why: "Three posts in week one establishes presence.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-7.lifestyle-audit",
        title: "Run the lifestyle-audit template",
        why: "Friction kills consistency more than willpower. Surface the friction now.",
        minutes: 45,
        manual: true,
      },
    ],
    reminder:
      "End of week 1. Most people quit between days 9-15. The boring days ARE the job.",
  }),
  withTotals({
    day: 8,
    title: "Build scraping infrastructure",
    goal: "Stand up the lead-scraping stack. 4,000 leads / 30 days = ~133/day.",
    steps: [
      {
        key: "day-8.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Volume.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-8.scraper-setup",
        title: "Configure Lead Scraper sources (Apify / Apollo / PhantomBuster / Vayne)",
        why: "Connect at least one source to start scraping in Naples.",
        minutes: 30,
        module_key: "lead_scraper",
        manual: false,
      },
      {
        key: "day-8.enrichment-setup",
        title: "Configure Lead Enrichment sources",
        why: "Enrichment chain takes raw scraped contacts to verified emails.",
        minutes: 15,
        module_key: "lead_enrichment",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 9,
    title: "Steady-state cycle",
    goal: "Apply, engage, post. No new system today.",
    steps: [
      {
        key: "day-9.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Boring is the point.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-9.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily presence beats weekly bursts.",
        minutes: 15,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 10,
    title: "Affiliate links + Upwork retrospective",
    goal: "Stop leaving money on the table. Review week 1 of Upwork.",
    steps: [
      {
        key: "day-10.affiliate-setup",
        title: "Sign up for affiliate programs you'll recommend (optional)",
        why: "You're recommending tools to clients anyway. Capture the kickback.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-10.upwork-retro",
        title: "Run an Upwork applications retro",
        why: "What got responses? What didn't? Next week's apps reflect this.",
        minutes: 45,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 11,
    title: "First lead scrape (1,000 leads)",
    goal: "Scrape your first batch. Run async — kick off, do other tasks, return.",
    steps: [
      {
        key: "day-11.community-retro",
        title: "Run a community-posts retro",
        why: "Which posts engaged? Mirror the winners next week.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-11.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Volume.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-11.scrape-batch-1",
        title: "Run scrape job — first 1,000 leads",
        why: "First of 4 batches this month. Naples runs it on your keys.",
        minutes: 30,
        module_key: "lead_scraper",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 12,
    title: "Lifestyle friction + website",
    goal: "Fix 5 friction points. Get a basic website live.",
    steps: [
      {
        key: "day-12.solve-friction",
        title: "Solve 5 friction points from the lifestyle audit",
        why: "Easy wins compound. Friction kills the program.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-12.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Daily.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-12.basic-site",
        title: "Ship a Carrd / Webflow single-pager",
        why: "For credibility. Don't optimize SEO. Single page is fine.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 13,
    title: "Second batch scrape",
    goal: "Scrape leads 1,001-2,000. Same setup as Day 11.",
    steps: [
      {
        key: "day-13.community-engage",
        title: "Engage 5 minutes per community",
        why: "Steady.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-13.scrape-batch-2",
        title: "Run scrape job — leads 1,001-2,000",
        why: "Same niche or test a sibling niche to widen the funnel.",
        minutes: 30,
        module_key: "lead_scraper",
        manual: false,
      },
      {
        key: "day-13.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Volume.",
        minutes: 60,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 14,
    title: "Build offers",
    goal: "Write 6 offers (2 per niche × 3 niches).",
    steps: [
      {
        key: "day-14.community-post",
        title: "Write community post #6",
        why: "Cadence.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-14.write-offers",
        title: "Write 6 offers using the formula",
        why: "Formula: 'I will give you [thing] in [time] or your money back — just send me [input].' Offer alone changes reply rate by 10×.",
        minutes: 90,
        manual: true,
      },
      {
        key: "day-14.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Daily.",
        minutes: 60,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 15,
    title: "Social profiles + third scrape",
    goal: "Create social profiles for credibility. Scrape 1,000 more leads.",
    steps: [
      {
        key: "day-15.social-profiles",
        title: "Create LinkedIn / Twitter / IG profiles",
        why: "Social is for credibility (warm leads check you), not lead source.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-15.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-15.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Volume.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-15.scrape-batch-3",
        title: "Run scrape job — leads 2,001-3,000",
        why: "Third of four batches.",
        minutes: 30,
        module_key: "lead_scraper",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 16,
    title: "Cold email reply infrastructure",
    goal: "Wire webhooks so you reply to cold-email replies in under 5 minutes.",
    steps: [
      {
        key: "day-16.community-post",
        title: "Write community post #7",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-16.reply-webhook",
        title: "Configure your tenant Instantly webhook → Naples",
        why: "Webhook fires Reply Intelligence: classifier → CRM advance → 5-min Slack.",
        minutes: 30,
        module_key: "email_triage",
        app: "email-triage",
        manual: false,
      },
      {
        key: "day-16.sla-dashboard",
        title: "Pin the Speed-to-Lead SLA dashboard on your phone",
        why: "Mobile-first dashboard surfaces the 5-min countdown. 400% conversion lift.",
        minutes: 5,
        module_key: "sla_dashboard",
        manual: false,
      },
      {
        key: "day-16.send-10-apps",
        title: "Send 10 Upwork applications",
        why: "Volume.",
        minutes: 60,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 17,
    title: "Cold email sequences + retrospectives",
    goal: "Write 6 cold-email sequences (2 per niche). Retro Upwork + calls week 2.",
    steps: [
      {
        key: "day-17.write-sequences",
        title: "Write 6 cold-email sequences (2 per niche)",
        why: "Each sequence = initial + 2 followups. Use offers from Day 14.",
        minutes: 90,
        manual: true,
      },
      {
        key: "day-17.calls-retro",
        title: "Review your call recordings and run a retro",
        why: "Person who reviews recordings progresses 3-4× faster.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-17.upwork-retro",
        title: "Upwork applications retro (week 2)",
        why: "Continue iterating.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 18,
    title: "Down-shift apps to 5/day",
    goal: "Apps drop from 10/day to 5/day — protect time as cold-email volume picks up.",
    steps: [
      {
        key: "day-18.send-5-apps",
        title: "Send 5 Upwork applications (down from 10)",
        why: "Email lead-flow is about to start. Don't double-up.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-18.solve-friction",
        title: "Solve 5 more friction points",
        why: "Friction up = consistency down.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-18.community-post",
        title: "Write community post #8",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 19,
    title: "Pre-send check",
    goal: "Final mailbox / DNS validation before going live.",
    steps: [
      {
        key: "day-19.community-retro",
        title: "Community-posts retro",
        why: "Mid-month read of what's working.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-19.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Half-volume from here on.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-19.deliverability-audit",
        title: "Run deliverability audit (SPF / DKIM / DMARC)",
        why: "One DKIM typo = 70% of emails to spam. Naples runs the audit.",
        minutes: 30,
        module_key: "outreach",
        app: "outreach-dispatcher",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 20,
    title: "Final pre-send checklist",
    goal: "Preview every variable. Confirm volumes. Final dry pass.",
    steps: [
      {
        key: "day-20.preflight",
        title: "Run pre-send checklist (variables + volumes + scheduling)",
        why: "Variables that don't fill = '{{firstName}}' arriving in real inboxes.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-20.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Daily.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-20.community-engage",
        title: "Engage 5 minutes per community",
        why: "Steady.",
        minutes: 15,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 21,
    title: "Skim cold email masterclass + post #10",
    goal: "Internalize the cold-email playbook before sending tomorrow.",
    steps: [
      {
        key: "day-21.read-masterclass",
        title: "Skim the 43-page cold email masterclass",
        why: "Reference doc — not memorize. Re-read sections as you iterate.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-21.community-post",
        title: "Write community post #10",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
    ],
    reminder: "Tomorrow you flip the switch. Last day before live cold email.",
  }),
  withTotals({
    day: 22,
    title: "TURN ON COLD EMAIL",
    goal: "Flip the switch. Cold email starts sending today.",
    steps: [
      {
        key: "day-22.launch-email",
        title: "Launch cold-email campaigns from Naples",
        why: "Watch reply rate first 48h. Don't tweak config yet — let data accumulate.",
        minutes: 15,
        module_key: "outreach",
        manual: false,
      },
      {
        key: "day-22.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Volume continues at half-speed.",
        minutes: 30,
        manual: true,
      },
    ],
    reminder: "First send is the moment cold email lead-flow begins.",
  }),
  withTotals({
    day: 23,
    title: "Post-send steady state",
    goal: "Monitor email. Keep posting. Keep engaging.",
    steps: [
      {
        key: "day-23.community-post",
        title: "Write community post #11",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-23.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-23.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Volume.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 24,
    title: "Proposal + Upwork retrospectives",
    goal: "Review what's converting in proposals + Upwork apps.",
    steps: [
      {
        key: "day-24.proposal-retro",
        title: "Run proposal retro",
        why: "Track which sections clients quote back. Cut sections nobody references.",
        minutes: 60,
        module_key: "proposal_generator",
        manual: false,
      },
      {
        key: "day-24.upwork-retro",
        title: "Upwork applications retro",
        why: "Iterate.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-24.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Volume.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 25,
    title: "Last lead scrape + post #12",
    goal: "Finish lead scraping for the month. 4,000 total = ~80 days of email.",
    steps: [
      {
        key: "day-25.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Daily.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-25.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-25.community-post",
        title: "Write community post #12",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-25.scrape-batch-4",
        title: "Run scrape job — final 1,000 leads",
        why: "Last of four batches. 4,000 total.",
        minutes: 30,
        module_key: "lead_scraper",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 26,
    title: "Steady state + post #13",
    goal: "Five days left. Repetition.",
    steps: [
      {
        key: "day-26.community-post",
        title: "Write community post #13",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-26.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-26.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Daily.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 27,
    title: "Set up CRM",
    goal: "Install lightweight CRM now that lead pipeline is real.",
    steps: [
      {
        key: "day-27.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Daily.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-27.community-engage",
        title: "Engage 5 minutes per community",
        why: "Daily.",
        minutes: 15,
        manual: true,
      },
      {
        key: "day-27.crm-setup",
        title: "Set up the CRM Pipeline (stages, custom fields)",
        why: "Now's the right time. Saraev: 'Before customers, what use is a CRM?'",
        minutes: 60,
        module_key: "crm",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 28,
    title: "Cold email retrospective + post #14",
    goal: "First real review of cold-email data (~2,000 sends).",
    steps: [
      {
        key: "day-28.community-post",
        title: "Write community post #14",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-28.send-5-apps",
        title: "Send 5 Upwork applications",
        why: "Daily.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-28.email-retro",
        title: "Run cold-email retro (open / reply / positive-reply / calls)",
        why: "Open <50% = DNS/warmup. Reply <2% = offer/copy. Diagnose, don't iterate blind.",
        minutes: 60,
        module_key: "outreach",
        manual: false,
      },
    ],
  }),
  withTotals({
    day: 29,
    title: "Last apps + new sequences",
    goal: "Ship final batch of apps. Iterate to v2 sequences.",
    steps: [
      {
        key: "day-29.last-apps",
        title: "Send 5 Upwork applications (final day)",
        why: "Final batch.",
        minutes: 30,
        manual: true,
      },
      {
        key: "day-29.write-v2-sequences",
        title: "Write 3 new cold-email sequences (v2 — one per niche)",
        why: "Carry forward what worked. Single-variable test against the v1 winner.",
        minutes: 60,
        manual: true,
      },
      {
        key: "day-29.community-post",
        title: "Write your last community post of the month",
        why: "Steady.",
        minutes: 30,
        manual: true,
      },
    ],
  }),
  withTotals({
    day: 30,
    title: "Rest + retrospective",
    goal: "First scheduled day off. Month-1 retrospective.",
    steps: [
      {
        key: "day-30.day-off",
        title: "Take the day off",
        why: "First scheduled day off in the program. Use it.",
        minutes: 0,
        manual: true,
      },
      {
        key: "day-30.month-retro",
        title: "Run month-1 retro (what worked, what surprised, what to keep)",
        why: "Month 2 starts tomorrow. Reflect first.",
        minutes: 60,
        manual: true,
      },
    ],
    reminder: "If you've followed the program, you have ~4,000 leads, ~2,000 sends, calls in motion. The next 60 days are about iteration.",
  }),
];

/** Aggregate stats for the funnel — used by the dashboard. */
export const PLAYBOOK_TOTALS = {
  total_days: PLAYBOOK.length,
  total_steps: PLAYBOOK.reduce((acc, d) => acc + d.steps.length, 0),
  total_minutes: PLAYBOOK.reduce((acc, d) => acc + d.total_minutes, 0),
  module_backed_steps: PLAYBOOK.reduce(
    (acc, d) => acc + d.steps.filter((s) => s.module_key).length,
    0,
  ),
  manual_steps: PLAYBOOK.reduce(
    (acc, d) => acc + d.steps.filter((s) => s.manual).length,
    0,
  ),
} as const;

export function getDay(day: number): PlaybookDay | null {
  return PLAYBOOK.find((d) => d.day === day) ?? null;
}

export function getStep(key: string): PlaybookStep | null {
  for (const day of PLAYBOOK) {
    const step = day.steps.find((s) => s.key === key);
    if (step) return step;
  }
  return null;
}
