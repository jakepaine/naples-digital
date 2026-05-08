#!/usr/bin/env -S npx tsx
/**
 * Seed makerschool_workflows + makerschool_tools with structured data
 * derived from `workflows_library.md` and `tools_inventory.md`.
 *
 * Idempotent — uses upsert on filename / lower(name).
 *
 * Run via:
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx seed-knowledge.ts
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
  return v;
}

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

// ─────────────────────────────────────────────────────────────────────────────
// Workflows
// ─────────────────────────────────────────────────────────────────────────────

type Platform = "make" | "n8n";
type Complexity = "simple" | "medium" | "complex";
type Relevance = "high" | "medium" | "low" | "skip";
type PortEffort = "S" | "M" | "L";
type NamedGap =
  | "content_syndication"
  | "email_triage"
  | "stripe_lead_won"
  | null;

interface WorkflowRow {
  filename: string;
  platform: Platform;
  display_name?: string;
  description?: string;
  trigger_kind?: string;
  apps?: string[];
  inputs?: string;
  outputs?: string;
  complexity?: Complexity;
  module_count?: number;
  naples_relevance?: Relevance;
  naples_module?: string;
  fills_named_gap?: NamedGap;
  port_effort?: PortEffort;
  notes?: string;
}

const workflows: WorkflowRow[] = [
  // ── HIGH relevance (fills named gaps or directly augments existing modules) ──
  {
    filename: "Content Syndication onto Twitter, Facebook, Instagram, LinkedIn, and Medium (1).json",
    platform: "make",
    display_name: "Content Syndication (5-platform)",
    description: "Tailors copy per-platform (char limits, tone, hashtags) and posts simultaneously to Twitter, Facebook, Instagram, LinkedIn, Medium when blog post is published.",
    trigger_kind: "webhook",
    apps: ["WordPress", "Twitter", "Facebook", "Instagram", "LinkedIn", "Medium", "Google Sheets"],
    inputs: "blog post URL + content + featured image",
    outputs: "5 platform-specific posts; engagement-tracking Sheet row",
    complexity: "complex",
    module_count: 20,
    naples_relevance: "high",
    naples_module: "content-pipeline",
    fills_named_gap: "content_syndication",
    port_effort: "M",
  },
  {
    filename: "Content_Syndication_onto_Twitter__Facebook__Instagram__LinkedIn__and_Medium.json",
    platform: "make",
    display_name: "Content Syndication (ASCII variant)",
    description: "Same as the (1) variant — different export format. Treat as duplicate.",
    naples_relevance: "high",
    naples_module: "content-pipeline",
    fills_named_gap: "content_syndication",
    port_effort: "M",
    notes: "duplicate of the first Content Syndication file",
  },
  {
    filename: "Email_Categorization_System.json",
    platform: "n8n",
    display_name: "Email Categorization System",
    description: "Watches inbox; AI-classifies into priority buckets (high/medium/low/spam); applies labels and routes to folders.",
    trigger_kind: "webhook",
    apps: ["Gmail", "OpenAI", "Google Sheets"],
    inputs: "subject, body, sender domain",
    outputs: "category label, folder move, lead score",
    complexity: "medium",
    module_count: 12,
    naples_relevance: "high",
    naples_module: "email-triage",
    fills_named_gap: "email_triage",
    port_effort: "M",
    notes: "Replace OpenAI with Claude to match platform LLM",
  },
  {
    filename: "Email_Autoresponder.json",
    platform: "n8n",
    display_name: "Email Autoresponder",
    description: "Watches inbox, classifies email intent, sends templated AI responses based on intent. Logs to Sheets.",
    trigger_kind: "webhook",
    apps: ["Gmail", "OpenAI", "Google Sheets", "Slack"],
    inputs: "email body + recipient",
    outputs: "auto-reply email, sheet log, optional Slack alert",
    complexity: "complex",
    module_count: 20,
    naples_relevance: "high",
    naples_module: "email-triage",
    fills_named_gap: "email_triage",
    port_effort: "M",
  },
  {
    filename: "email_autoresponder (1) (5).json",
    platform: "n8n",
    display_name: "Email Autoresponder (alt)",
    description: "Lighter variant of Email_Autoresponder.json with fewer branches.",
    naples_relevance: "high",
    naples_module: "email-triage",
    fills_named_gap: "email_triage",
    notes: "Reference only; pick the larger Email_Autoresponder.json as the spec",
  },
  {
    filename: "Instantly.ai Auto-Reply Bot.json",
    platform: "n8n",
    display_name: "Instantly Auto-Reply Bot",
    description: "Watches Instantly cold-email campaign for replies/bounces; classifies reply intent; scores lead; auto-replies to bounces.",
    trigger_kind: "webhook",
    apps: ["Instantly", "Email", "ClickUp"],
    inputs: "reply body, sender, original campaign metadata",
    outputs: "auto-response email, lead score, ClickUp priority update",
    complexity: "medium",
    module_count: 12,
    naples_relevance: "high",
    naples_module: "outreach",
    fills_named_gap: null,
    port_effort: "M",
  },
  {
    filename: "CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json",
    platform: "make",
    display_name: "CRM Lead Won → Stripe Invoice",
    description: "Watches ClickUp for Lead Won status; generates invoice from template; sends via email; creates Stripe payment link.",
    trigger_kind: "watch",
    apps: ["ClickUp", "PandaDoc", "Stripe", "Email", "Google Sheets"],
    inputs: "ClickUp task with custom fields",
    outputs: "invoice PDF, Stripe payment link, email sent",
    complexity: "medium",
    module_count: 12,
    naples_relevance: "high",
    naples_module: "crm-pipeline",
    fills_named_gap: "stripe_lead_won",
    port_effort: "M",
  },
  {
    filename: "Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json",
    platform: "n8n",
    display_name: "Stripe Payment → ClickUp + Trello Onboarding",
    description: "Stripe payment_intent.succeeded → updates ClickUp to Payment Received; creates Trello onboarding card; sends welcome email.",
    trigger_kind: "webhook",
    apps: ["Stripe", "ClickUp", "Trello", "Email", "Google Sheets"],
    inputs: "Stripe payment metadata",
    outputs: "ClickUp task update, Trello card, welcome email",
    complexity: "medium",
    module_count: 10,
    naples_relevance: "high",
    naples_module: "client-portal",
    fills_named_gap: "stripe_lead_won",
    port_effort: "M",
  },
  {
    filename: "1. Automatic Invoice Collection (1) (1).json",
    platform: "make",
    display_name: "Automatic Invoice Collection",
    description: "Stripe payment_succeeded → invoice PDF + thank-you email + ClickUp fulfillment task + Slack alert.",
    trigger_kind: "webhook",
    apps: ["Stripe", "PandaDoc", "Email", "ClickUp", "Slack"],
    complexity: "medium",
    module_count: 10,
    naples_relevance: "high",
    naples_module: "crm-pipeline",
    fills_named_gap: "stripe_lead_won",
    port_effort: "M",
  },
  {
    filename: "Automated Followup System.json",
    platform: "make",
    display_name: "Automated Followup System",
    description: "3-stage followup cadence (3/7/14 day) for Instantly cold-email leads; customizes by which links were clicked; logs to CRM.",
    trigger_kind: "webhook",
    apps: ["Instantly", "Email", "ClickUp", "Google Sheets"],
    inputs: "lead email, initial campaign content",
    outputs: "followup emails, CRM log, engagement score",
    complexity: "complex",
    module_count: 25,
    naples_relevance: "high",
    naples_module: "outreach",
    port_effort: "M",
  },
  {
    filename: "AI Proposal Generator Flow (1).json",
    platform: "make",
    display_name: "AI Proposal Generator Flow",
    description: "Form submission → Claude writes scope/timeline/pricing → PDF from template → email → ClickUp + Slack.",
    trigger_kind: "webhook",
    apps: ["Typeform", "Claude", "PDF.co", "Email", "ClickUp", "Slack"],
    inputs: "lead form data",
    outputs: "proposal PDF, email, ClickUp task",
    complexity: "medium",
    module_count: 12,
    naples_relevance: "high",
    naples_module: "proposal-generator",
    port_effort: "M",
    notes: "Day 5 of the playbook references this directly",
  },
  {
    filename: "AI Proposal Generator System.json",
    platform: "make",
    display_name: "AI Proposal Generator System",
    description: "Smaller cleaner variant of the Proposal Generator Flow. Watches ClickUp instead of form trigger.",
    trigger_kind: "watch",
    apps: ["ClickUp", "Claude", "PandaDoc", "Email"],
    complexity: "medium",
    naples_relevance: "high",
    naples_module: "proposal-generator",
    port_effort: "M",
  },
  {
    filename: "Scrape & Send to Anymailfinder.json",
    platform: "n8n",
    display_name: "Scrape & Send to Anymailfinder",
    description: "Domain list → batch query Anymailfinder → filter by job title → export to Sheets.",
    trigger_kind: "manual",
    apps: ["Anymailfinder", "Google Sheets"],
    complexity: "simple",
    module_count: 7,
    naples_relevance: "high",
    naples_module: "outreach",
    port_effort: "S",
  },
  {
    filename: "Retrieve Enrichment Results & Search for DM.json",
    platform: "n8n",
    display_name: "Retrieve Enrichment Results & Search for DM",
    description: "Takes scraped LinkedIn profiles; enriches with Anymailfinder + Apollo/Hunter; prepares CSV for cold email.",
    trigger_kind: "manual",
    apps: ["Anymailfinder", "Apollo", "Google Sheets"],
    complexity: "medium",
    module_count: 12,
    naples_relevance: "high",
    naples_module: "outreach",
    port_effort: "M",
  },
  // ── MEDIUM relevance ──
  {
    filename: "monday_webhook_slides_proposal_generator (1) (1).json",
    platform: "make",
    display_name: "Monday Webhook → Slides Proposal",
    description: "Monday.com webhook → fills Google Slides template with deal details → sends presentation link.",
    trigger_kind: "webhook",
    apps: ["Monday.com", "Google Slides", "Email"],
    complexity: "medium",
    naples_relevance: "medium",
    naples_module: "proposal-generator",
    port_effort: "S",
  },
  {
    filename: "1. LinkedIn DM Outreach System (1).json",
    platform: "n8n",
    display_name: "LinkedIn DM Outreach (Step 1)",
    description: "Step 1 of multi-step LinkedIn outreach: triggers PhantomBuster scrape of LinkedIn profiles by job-title query.",
    trigger_kind: "manual",
    apps: ["PhantomBuster", "Google Sheets"],
    complexity: "simple",
    module_count: 6,
    naples_relevance: "medium",
    naples_module: "outreach",
    port_effort: "S",
  },
  {
    filename: "LinkedIn_Parasite_System_in_n8n (1).json",
    platform: "n8n",
    display_name: "LinkedIn Parasite System",
    description: "Scrapes trending LinkedIn content via Apify; classifies; republishes as own posts (parasite SEO).",
    trigger_kind: "schedule",
    apps: ["Apify", "LinkedIn"],
    complexity: "medium",
    module_count: 12,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "AI Parasite SEO System (Medium) (1).json",
    platform: "n8n",
    display_name: "AI Parasite SEO (Medium)",
    description: "Scrapes trending Medium articles → Claude generates spin → publishes new Medium post → syndicates to Twitter/LinkedIn.",
    trigger_kind: "schedule",
    apps: ["Medium", "Claude", "Twitter", "LinkedIn", "Google Analytics"],
    complexity: "complex",
    module_count: 22,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "L",
  },
  {
    filename: "Parasite_Medium_SEO_System.json",
    platform: "make",
    display_name: "Parasite Medium SEO System",
    description: "Reformats blog posts for Medium; adds tags; publishes; logs URL.",
    trigger_kind: "manual",
    apps: ["WordPress", "Medium", "Google Sheets"],
    complexity: "simple",
    module_count: 10,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "S",
  },
  {
    filename: "Twitter_Apify_Parasite.json",
    platform: "make",
    display_name: "Twitter Apify Parasite",
    description: "Scrapes top tweets by keyword via Apify → reformats with own commentary → schedules to your Twitter.",
    trigger_kind: "schedule",
    apps: ["Apify", "Twitter", "Google Sheets"],
    complexity: "medium",
    module_count: 13,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "1. Trigger Apify Run (1) (1).json",
    platform: "n8n",
    display_name: "Trigger Apify Run (Step 1)",
    description: "Kicks off an Apify actor run with search params; returns dataset ID. Generic building block.",
    trigger_kind: "manual",
    apps: ["Apify"],
    complexity: "simple",
    module_count: 5,
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "2. Watch Actor Runs -_ Get Data (1).json",
    platform: "n8n",
    display_name: "Watch Actor Runs → Get Data (Step 2)",
    description: "Polls Apify for run completion; downloads dataset; parses; exports.",
    trigger_kind: "schedule",
    apps: ["Apify", "Google Sheets"],
    complexity: "simple",
    module_count: 6,
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "Instagram_Scraping_with_PhantomBuster.json",
    platform: "n8n",
    display_name: "Instagram Scraping with PhantomBuster",
    description: "Scrapes IG profiles by hashtag/location; saves handles/follower counts/engagement to Sheets.",
    trigger_kind: "schedule",
    apps: ["PhantomBuster", "Google Sheets"],
    complexity: "simple",
    module_count: 7,
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "1. Launch Bulk PhantomBuster Instagram Scraper (1) (1).json",
    platform: "n8n",
    display_name: "Bulk PhantomBuster IG Scraper (Step 1)",
    description: "Configures + launches bulk PhantomBuster IG actor (100+ profiles).",
    apps: ["PhantomBuster"],
    complexity: "simple",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "2. Watch Output of Bulk PhantomBuster Instagram Scraper (1) (1).json",
    platform: "n8n",
    display_name: "Bulk PhantomBuster IG Scraper (Step 2)",
    description: "Polls for completion; downloads; parses; exports.",
    apps: ["PhantomBuster", "Google Sheets"],
    complexity: "simple",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "3. Launch Individual PhantomBuster Instagram Scraper (1) (2).json",
    platform: "n8n",
    display_name: "Individual PhantomBuster IG Scraper (Step 3)",
    description: "Single-profile detail scrape (posts, captions, hashtags, engagement).",
    apps: ["PhantomBuster"],
    complexity: "simple",
    naples_relevance: "low",
    port_effort: "S",
  },
  {
    filename: "Apify_Scrape_New_Instagram_Reels____Transcribe____Add_to_Sheet (2).json",
    platform: "n8n",
    display_name: "Apify Scrape IG Reels → Transcribe → Sheet",
    description: "Scrapes new Reels by account; downloads; transcribes via Whisper; extracts hashtags+captions; writes to Sheets.",
    trigger_kind: "schedule",
    apps: ["Apify", "Whisper", "Google Sheets"],
    complexity: "medium",
    module_count: 13,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
    notes: "Replace Whisper with Gemini 2.5 Flash to match platform LLM",
  },
  {
    filename: "AI_Facebook_Ad_Spy_Tool (1).json",
    platform: "n8n",
    display_name: "AI Facebook Ad Spy Tool",
    description: "Scrapes FB Ad Library for competitor ads; extracts copy + landing URLs + estimated spend; report on winning patterns.",
    apps: ["Facebook Ad Library", "Google Sheets"],
    complexity: "medium",
    module_count: 12,
    naples_relevance: "medium",
    port_effort: "M",
  },
  {
    filename: "AI Content Generator (3).json",
    platform: "make",
    display_name: "AI Content Generator (Make)",
    description: "Topic → outlines → 2000+ word post → 3-5 social variants → DALL-E image → WordPress + social publishes.",
    apps: ["Claude", "DALL-E", "WordPress", "Twitter", "LinkedIn", "Google Drive"],
    complexity: "complex",
    module_count: 25,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "L",
  },
  {
    filename: "AI_Content_Generator.json",
    platform: "n8n",
    display_name: "AI Content Generator (n8n)",
    description: "Title+keyword → Claude generates 800-1500 word SEO article → Google Docs → email preview link.",
    apps: ["Claude", "Google Docs", "Email"],
    complexity: "simple",
    module_count: 8,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "S",
  },
  {
    filename: "Cyclic Content Generator.json",
    platform: "make",
    display_name: "Cyclic Content Generator (Make)",
    description: "Watches RSS feeds; generates 'what's new' summaries; syndicates to social; calendar in Sheets.",
    apps: ["RSS", "Claude", "social", "Google Sheets"],
    complexity: "medium",
    module_count: 14,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "Cyclic_Content_Generator.json",
    platform: "n8n",
    display_name: "Cyclic Content Generator (n8n)",
    description: "n8n variant of the Cyclic Content Generator.",
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "Deep Content Generator.json",
    platform: "make",
    display_name: "Deep Content Generator",
    description: "Single keyword → Claude in loop generates 3000+ word deep-dive → 5-7 DALL-E section images → publishes.",
    apps: ["Claude", "DALL-E", "WordPress"],
    complexity: "medium",
    module_count: 14,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "YouTube Repurposing w Unique Changes.json",
    platform: "make",
    display_name: "YouTube Repurposing (Part 1)",
    description: "Watches YT channel; downloads via youtube-dl; Whisper transcript; Claude summary; Sheets log.",
    trigger_kind: "schedule",
    apps: ["YouTube", "youtube-dl", "Whisper", "Google Sheets"],
    complexity: "complex",
    module_count: 22,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "L",
  },
  {
    filename: "YouTube to Blog Post Generator (1) (1).json",
    platform: "make",
    display_name: "YouTube → Blog Post Generator",
    description: "Transcript → Claude writes 2000+ word blog → DALL-E featured image → WordPress.",
    apps: ["Claude", "DALL-E", "WordPress", "Google Sheets"],
    complexity: "medium",
    module_count: 14,
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "YouTube_to_Blog_Post_Generator.json",
    platform: "n8n",
    display_name: "YouTube → Blog Post Generator (n8n)",
    description: "n8n variant of YouTube → Blog generator.",
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "AI PODCAST REPURPOSING ENGINE 1.json",
    platform: "n8n",
    display_name: "Podcast Repurposing (Part 1)",
    description: "Downloads latest podcast episode (RSS); Whisper transcript; Claude generates title/description.",
    apps: ["RSS", "Whisper", "Claude"],
    complexity: "medium",
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "M",
  },
  {
    filename: "AI PODCAST REPURPOSING ENGINE 2.json",
    platform: "n8n",
    display_name: "Podcast Repurposing (Part 2)",
    description: "Transcript → 3-5 blog post variants → 10+ short-form clips → LinkedIn article → publishes across platforms.",
    apps: ["Claude", "WordPress", "LinkedIn", "Twitter"],
    complexity: "complex",
    naples_relevance: "medium",
    naples_module: "content-pipeline",
    port_effort: "L",
  },
  {
    filename: "AI_Graphic_Designer (1).json",
    platform: "n8n",
    display_name: "AI Graphic Designer (master)",
    description: "Orchestrates 4 sub-workflows: style guide → logo → ad creatives → user revises.",
    naples_relevance: "medium",
    naples_module: "sponsor-pitch",
    port_effort: "L",
  },
  {
    filename: "Logo_Generator__AI_Graphic_Designer_.json",
    platform: "n8n",
    display_name: "AI Graphic Designer — Logo Generator (sub)",
    description: "Sub-workflow of AI Graphic Designer.",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "Style_Guide_Generator__AI_Graphic_Designer_.json",
    platform: "n8n",
    display_name: "AI Graphic Designer — Style Guide Generator (sub)",
    description: "Sub-workflow of AI Graphic Designer.",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "Image_Spinner__1_Click___1000_Ad_Creatives_.json",
    platform: "n8n",
    display_name: "AI Graphic Designer — Image Spinner (sub)",
    description: "Sub-workflow used by both AI Graphic Designer and 1-Click 1000 Ad Creatives.",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "Gradient_Image__AI_Graphic_Designer_.json",
    platform: "n8n",
    display_name: "AI Graphic Designer — Gradient Image (sub)",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "Design_Editor_Revisor__AI_Graphic_Designer_.json",
    platform: "n8n",
    display_name: "AI Graphic Designer — Design Editor (sub)",
    naples_relevance: "medium",
    port_effort: "S",
  },
  {
    filename: "1_Click___1000_Ad_Creatives_Agent.json",
    platform: "n8n",
    display_name: "1-Click 1000 Ad Creatives Agent",
    description: "Agentic loop: 100+ headlines → 1000+ DALL-E images → samples + ranks → outputs top 50.",
    apps: ["Claude", "DALL-E", "Google Sheets", "Drive"],
    complexity: "complex",
    module_count: 22,
    naples_relevance: "medium",
    port_effort: "L",
  },
  {
    filename: "General Application Form Fill -_ Add to ClickUp Hiring Pipeline.json",
    platform: "make",
    display_name: "Application Form → ClickUp Hiring Pipeline",
    description: "Typeform → ClickUp task with applicant data as custom fields → confirmation email → Slack alert.",
    apps: ["Typeform", "ClickUp", "Email", "Slack"],
    complexity: "simple",
    module_count: 8,
    naples_relevance: "medium",
    naples_module: "crm-pipeline",
    port_effort: "S",
    notes: "Pattern reusable for any form-driven lead intake",
  },
  {
    filename: "Hiring Pipeline Status Changed to _Request Trial_ -_ Send Email.json",
    platform: "make",
    display_name: "Pipeline Status → Email",
    description: "ClickUp status change to 'Request Trial' → templated email; updates ClickUp with timestamp.",
    apps: ["ClickUp", "Email"],
    complexity: "simple",
    module_count: 6,
    naples_relevance: "medium",
    naples_module: "crm-pipeline",
    port_effort: "S",
    notes: "Pattern reusable for status-change-triggered emails in CRM",
  },
  {
    filename: "Bland_ai_Call.json",
    platform: "n8n",
    display_name: "Bland.ai Phone Call",
    description: "Form submission → Bland.ai initiates AI phone call to lead → records → transcribes → CRM log.",
    trigger_kind: "webhook",
    apps: ["Bland.ai", "Google Sheets", "Slack"],
    complexity: "simple",
    module_count: 5,
    naples_relevance: "medium",
    naples_module: "outreach",
    port_effort: "S",
    notes: "MIA real-estate vertical could use this",
  },
  // ── LOW relevance / SKIP ──
  {
    filename: "AI_Automated_Resume_System.json",
    platform: "n8n",
    display_name: "AI Automated Resume System (Upwork)",
    description: "Watches Upwork for new jobs → Claude rewrites resume per JD → PDF → cover letter → uploads.",
    naples_relevance: "skip",
    notes: "Upwork-freelance specific",
  },
  {
    filename: "Upwork_Scraper.json",
    platform: "n8n",
    display_name: "Upwork Scraper",
    naples_relevance: "skip",
    notes: "Upwork-freelance specific",
  },
  {
    filename: "Updated Upwork _RSS_ Feed.json",
    platform: "make",
    display_name: "Updated Upwork RSS Feed",
    naples_relevance: "skip",
    notes: "Upwork-freelance specific",
  },
  {
    filename: "1__YouTube_Trend_Detector__Add_Update.json",
    platform: "n8n",
    display_name: "YouTube Trend Detector — Add/Update",
    description: "Daily YT trending → top 50-100 → keyword analysis → store with timestamp.",
    apps: ["YouTube"],
    complexity: "simple",
    naples_relevance: "low",
  },
  {
    filename: "YouTube_Trend_Detector__Add_Update.json",
    platform: "n8n",
    display_name: "YouTube Trend Detector — Add/Update (variant)",
    naples_relevance: "low",
  },
  {
    filename: "2__YouTube_Trend_Detector__Daily_Digest.json",
    platform: "n8n",
    display_name: "YouTube Trend Detector — Daily Digest",
    description: "Compares today vs yesterday's trends; emails digest + Slack post.",
    naples_relevance: "low",
  },
  // ── Make.com Accelerator tutorials ──
  ...["First", "Second", "Third Scenario (Google Slides)", "Fourth", "Fifth", "sixth scenario", "seventh scenario"].map(
    (label, i): WorkflowRow => {
      const num = i + 1;
      // Filename pattern is inconsistent in the source files
      const fileMap: Record<number, string> = {
        1: "Make.com Accelerator- Your First Scenario (1).blueprint.json",
        2: "Make.com Accelerator- Your Second Scenario (2).blueprint (1).json",
        3: "Make.com Accelerator- Your Third Scenario (Google Slides) (3).blueprint.json",
        4: "Make.com Accelerator- Your Fourth Scenario (4).blueprint.json",
        5: "Make.com Accelerator- Your Fifth Scenario (5).blueprint.json",
        6: "Make.com Accelerator- Your sixth scenario (6).blueprint.json",
        7: "Make.com Accelerator- Your seventh scenario (7).blueprint (1).json",
      };
      return {
        filename: fileMap[num]!,
        platform: "make",
        display_name: `Make Accelerator — Scenario ${num}`,
        description: `Make.com Accelerator tutorial scenario ${num}. Educational, not production.`,
        naples_relevance: "skip",
        notes: "Tutorial blueprint",
      };
    },
  ),
  // ── n8n tutorial workflows ──
  ...["second", "third", "fourth", "fifth", "sixth", "seventh"].map(
    (ord): WorkflowRow => ({
      filename: `Your ${ord} workflow.json`,
      platform: "n8n",
      display_name: `n8n Tutorial — Your ${ord} workflow`,
      description: `n8n educational tutorial workflow.`,
      naples_relevance: "skip",
      notes: "Tutorial workflow",
    }),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

interface ToolRow {
  name: string;
  category: string;
  description?: string;
  pricing_model: "free" | "freemium" | "paid" | "subscription";
  affiliate_url?: string;
  homepage_url?: string;
  first_appears_day?: number;
  notes?: string;
}

const tools: ToolRow[] = [
  // Cold email
  {
    name: "Instantly.ai",
    category: "cold_email",
    description: "Cold email sending platform — primary recommendation. Inbox warmup, sending, unibox, webhooks.",
    pricing_model: "subscription",
    affiliate_url: "https://instantly.ai/?via=nick-saraev",
    homepage_url: "https://instantly.ai/",
    first_appears_day: 1,
    notes: "Day 1 tool stack #1",
  },
  {
    name: "Smartlead.ai",
    category: "cold_email",
    description: "Cold email alternative to Instantly. Same workflow.",
    pricing_model: "subscription",
    affiliate_url: "https://smartlead.ai?via=nick-saraev",
    homepage_url: "https://smartlead.ai/",
    first_appears_day: 1,
    notes: "Day 1 tool stack #2",
  },
  {
    name: "AnyMailFinder",
    category: "enrichment",
    description: "Email enrichment — turn LinkedIn URL or domain into verified email.",
    pricing_model: "subscription",
    affiliate_url: "https://anymailfinder.com?via=nick",
    homepage_url: "https://anymailfinder.com/",
    first_appears_day: 8,
    notes: "Day 1 tool stack #3",
  },
  {
    name: "Apollo.io",
    category: "enrichment",
    description: "B2B contact database + email enrichment. Free tier covers many cases.",
    pricing_model: "freemium",
    homepage_url: "https://apollo.io/",
    first_appears_day: 8,
    notes: "Day 1 tool stack #4",
  },
  {
    name: "PhantomBuster",
    category: "scraping",
    description: "Scrapes LinkedIn + Instagram profiles, follower lists, post engagement.",
    pricing_model: "subscription",
    affiliate_url: "https://phantombuster.com?deal=noah60",
    homepage_url: "https://phantombuster.com/",
    first_appears_day: 8,
    notes: "Day 1 tool stack #5",
  },
  {
    name: "Apify",
    category: "scraping",
    description: "General-purpose web scraping platform. Twitter, LinkedIn, Google Maps, Instagram, Upwork actors.",
    pricing_model: "freemium",
    affiliate_url: "https://apify.com?fpr=nick",
    homepage_url: "https://apify.com/",
    first_appears_day: 8,
    notes: "Day 1 tool stack #11; promo code 30NS = 30% off 2 mo",
  },
  // Proposals
  {
    name: "PandaDoc",
    category: "proposals",
    description: "Proposal docs, e-signature, automated proposal flows.",
    pricing_model: "subscription",
    affiliate_url: "https://pandadoc.partnerlinks.io/ar44yghojibe",
    homepage_url: "https://pandadoc.com/",
    first_appears_day: 5,
    notes: "Day 1 tool stack #6",
  },
  {
    name: "Typeform",
    category: "forms",
    description: "Intake forms (lead capture, hiring, onboarding).",
    pricing_model: "freemium",
    homepage_url: "https://typeform.com/",
    notes: "Day 1 tool stack #7",
  },
  // CRM / PM
  {
    name: "ClickUp",
    category: "crm",
    description: "CRM, hiring pipeline, project management. Nick's primary recommendation.",
    pricing_model: "freemium",
    affiliate_url: "https://clickup.pxf.io/4PQo61",
    homepage_url: "https://clickup.com/",
    first_appears_day: 27,
    notes: "Day 1 tool stack #8",
  },
  {
    name: "Monday.com",
    category: "crm",
    description: "CRM alternative to ClickUp.",
    pricing_model: "subscription",
    affiliate_url: "https://try.monday.com/1ty9wtpsara2",
    homepage_url: "https://monday.com/",
    first_appears_day: 27,
    notes: "Day 1 tool stack #9",
  },
  {
    name: "Notion",
    category: "crm",
    description: "Docs, wiki, lightweight CRM, knowledge base.",
    pricing_model: "freemium",
    affiliate_url: "https://affiliate.notion.so/3viwitl53eg7",
    homepage_url: "https://notion.so/",
    first_appears_day: 27,
    notes: "Day 1 tool stack #10",
  },
  {
    name: "Trello",
    category: "crm",
    description: "Lightweight kanban for client onboarding.",
    pricing_model: "freemium",
    homepage_url: "https://trello.com/",
  },
  // Automation platforms
  {
    name: "Make.com",
    category: "automation",
    description: "No-code automation platform; dominant in this course. NOT for Naples Digital production code.",
    pricing_model: "freemium",
    homepage_url: "https://make.com/",
    first_appears_day: 1,
    notes: "Day 1 tool stack #12; reference-only per platform rules",
  },
  {
    name: "n8n",
    category: "automation",
    description: "Open-source automation platform. Self-hostable. NOT for Naples Digital tenant deployments.",
    pricing_model: "free",
    homepage_url: "https://n8n.io/",
    notes: "Reference-only per Naples Digital pivot",
  },
  {
    name: "Claude Code",
    category: "ai_coding",
    description: "AI agent workspace for building automations + custom code.",
    pricing_model: "subscription",
    homepage_url: "https://claude.com/claude-code",
    first_appears_day: 4,
  },
  {
    name: "Botpress",
    category: "chatbot",
    description: "Chatbot builder.",
    pricing_model: "freemium",
    homepage_url: "https://botpress.com/",
    notes: "Day 1 tool stack #14",
  },
  // Design
  {
    name: "Bannerbear",
    category: "design",
    description: "Programmatic image generation (ad creatives, social cards).",
    pricing_model: "subscription",
    homepage_url: "https://bannerbear.com/",
    notes: "Day 1 tool stack #13",
  },
  {
    name: "DALL-E",
    category: "ai_image",
    description: "AI image generation (logos, ad creatives, blog featured images).",
    pricing_model: "paid",
    homepage_url: "https://openai.com/dall-e-3",
  },
  {
    name: "Webflow",
    category: "website",
    description: "Website builder — heavier than Carrd.",
    pricing_model: "freemium",
    homepage_url: "https://webflow.com/",
    notes: "Day 1 tool stack #15",
  },
  {
    name: "Carrd",
    category: "website",
    description: "Single-page website builder.",
    pricing_model: "freemium",
    homepage_url: "https://carrd.co/",
    first_appears_day: 12,
    notes: "Day 1 tool stack #16",
  },
  // AI / LLMs
  {
    name: "Anthropic Claude",
    category: "ai_llm",
    description: "Primary LLM in workflows. Naples Digital uses Sonnet 4.6 platform-wide.",
    pricing_model: "paid",
    homepage_url: "https://anthropic.com/",
  },
  {
    name: "OpenAI",
    category: "ai_llm",
    description: "Alternative LLM in older course workflows.",
    pricing_model: "paid",
    homepage_url: "https://openai.com/",
    first_appears_day: 1,
  },
  {
    name: "Whisper",
    category: "ai_audio",
    description: "OpenAI audio/video transcription used in repurposing workflows.",
    pricing_model: "paid",
    homepage_url: "https://openai.com/research/whisper",
    notes: "Naples Digital prefers Gemini 2.5 Flash native video understanding",
  },
  {
    name: "Gemini",
    category: "ai_llm",
    description: "Google LLM with native video understanding. Used by process-videos.ts.",
    pricing_model: "freemium",
    homepage_url: "https://ai.google.dev/",
  },
  {
    name: "ElevenLabs",
    category: "ai_voice",
    description: "AI voice generation.",
    pricing_model: "freemium",
    homepage_url: "https://elevenlabs.io/",
  },
  {
    name: "Bland.ai",
    category: "ai_voice",
    description: "AI-powered outbound phone calls.",
    pricing_model: "paid",
    homepage_url: "https://bland.ai/",
  },
  // Payments
  {
    name: "Stripe",
    category: "payments",
    description: "Payment processor. Most automation-friendly per Nick.",
    pricing_model: "paid",
    homepage_url: "https://stripe.com/",
    first_appears_day: 6,
  },
  // Time tracking
  {
    name: "Rize.io",
    category: "time_tracking",
    description: "Automatic time tracking with AI categorization.",
    pricing_model: "subscription",
    affiliate_url: "https://rize.io?via=LEFTCLICKAI",
    homepage_url: "https://rize.io/",
    first_appears_day: 3,
    notes: "Promo code NICK",
  },
  {
    name: "Toggl",
    category: "time_tracking",
    description: "Manual time tracking.",
    pricing_model: "freemium",
    affiliate_url: "https://toggl.com/?via=nick",
    homepage_url: "https://toggl.com/",
    first_appears_day: 3,
  },
  {
    name: "Harvest",
    category: "time_tracking",
    description: "Time tracking with invoicing.",
    pricing_model: "freemium",
    homepage_url: "https://www.getharvest.com/",
    first_appears_day: 3,
  },
  // Recording
  {
    name: "Fireflies.ai",
    category: "call_recording",
    description: "Call recording + AI summarization.",
    pricing_model: "freemium",
    affiliate_url: "https://fireflies.ai/?fpr=nick33",
    homepage_url: "https://fireflies.ai/",
    first_appears_day: 4,
    notes: "Already in Naples Digital + radenergy-os stack",
  },
  {
    name: "Fathom",
    category: "call_recording",
    description: "Alternative call recording.",
    pricing_model: "freemium",
    homepage_url: "https://fathom.video/",
    first_appears_day: 4,
  },
  {
    name: "Loom",
    category: "screen_recording",
    description: "Screen recording for Upwork application videos. Core tool — every Upwork app uses Loom.",
    pricing_model: "freemium",
    homepage_url: "https://loom.com/",
    first_appears_day: 3,
  },
  // Naming
  {
    name: "Namelix",
    category: "naming",
    description: "AI business name generator.",
    pricing_model: "free",
    homepage_url: "https://namelix.com/",
    first_appears_day: 1,
  },
  {
    name: "NameSnack",
    category: "naming",
    description: "Name generator alternative.",
    pricing_model: "free",
    homepage_url: "https://www.namesnack.com/",
    first_appears_day: 1,
  },
  // Communities + content
  {
    name: "Skool",
    category: "community",
    description: "Community platform. MakerSchool itself runs on Skool.",
    pricing_model: "freemium",
    homepage_url: "https://skool.com/",
    first_appears_day: 3,
  },
  {
    name: "Discord",
    category: "community",
    description: "Alternative community platform.",
    pricing_model: "free",
    homepage_url: "https://discord.com/",
    first_appears_day: 3,
  },
  {
    name: "Slack",
    category: "communications",
    description: "Notifications + ops alerting in workflows.",
    pricing_model: "freemium",
    homepage_url: "https://slack.com/",
  },
  {
    name: "WordPress",
    category: "publishing",
    description: "Blog publishing target in many content workflows.",
    pricing_model: "freemium",
    homepage_url: "https://wordpress.org/",
  },
  {
    name: "Medium",
    category: "publishing",
    description: "Parasite SEO target — publish duplicated content for Medium's domain authority.",
    pricing_model: "free",
    homepage_url: "https://medium.com/",
  },
  {
    name: "YouTube",
    category: "publishing",
    description: "Content source (repurposing) and content target.",
    pricing_model: "free",
    homepage_url: "https://youtube.com/",
  },
  {
    name: "Google Sheets",
    category: "storage",
    description: "Universal data store across the entire course. Almost every workflow writes to a Sheet.",
    pricing_model: "free",
    homepage_url: "https://sheets.google.com/",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`upserting ${workflows.length} workflows…`);
  const { error: wErr } = await supabase
    .from("makerschool_workflows")
    .upsert(workflows, { onConflict: "filename" });
  if (wErr) {
    console.error("workflows failed:", wErr);
    process.exit(1);
  }
  console.log(`  ok`);

  console.log(`upserting ${tools.length} tools…`);
  // tools have a unique index on lower(name) — we need to detect existing rows
  // by case-insensitive match. Easiest: fetch all existing names, decide
  // insert vs update per row.
  const { data: existing, error: fetchErr } = await supabase
    .from("makerschool_tools")
    .select("id, name");
  if (fetchErr) {
    console.error("tools fetch failed:", fetchErr);
    process.exit(1);
  }
  const nameToId = new Map(
    (existing ?? []).map((r) => [r.name.toLowerCase(), r.id]),
  );

  let inserted = 0,
    updated = 0;
  for (const tool of tools) {
    const lower = tool.name.toLowerCase();
    const existingId = nameToId.get(lower);
    if (existingId) {
      const { error } = await supabase
        .from("makerschool_tools")
        .update(tool)
        .eq("id", existingId);
      if (error) {
        console.error(`update ${tool.name} failed:`, error);
        process.exit(1);
      }
      updated++;
    } else {
      const { error } = await supabase.from("makerschool_tools").insert(tool);
      if (error) {
        console.error(`insert ${tool.name} failed:`, error);
        process.exit(1);
      }
      inserted++;
    }
  }
  console.log(`  ok (inserted ${inserted}, updated ${updated})`);

  // Final counts
  const counts = await Promise.all([
    supabase
      .from("makerschool_workflows")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("makerschool_tools")
      .select("*", { count: "exact", head: true }),
  ]);
  console.log(`\nfinal counts:`);
  console.log(`  makerschool_workflows: ${counts[0].count}`);
  console.log(`  makerschool_tools:     ${counts[1].count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
