// Shared mock data for the entire Naples Digital × 239 Live demo system.
// All apps import from @naples/mock-data so MRR / leads / episodes stay
// consistent everywhere.

export type BookingStatus = "confirmed" | "pending" | "completed";

export interface Booking {
  id: string;
  client: string;
  package: string;
  date: string;
  revenue: number;
  status: BookingStatus;
}

export const MOCK_BOOKINGS: Booking[] = [
  { id: "1", client: "Naples Luxury Properties", package: "Real Estate Session", date: "2025-05-02", revenue: 500, status: "confirmed" },
  { id: "2", client: "Gulf Coast Mortgage", package: "Gold Sponsor Recording", date: "2025-05-03", revenue: 1000, status: "confirmed" },
  { id: "3", client: "Fort Myers Fitness Co", package: "Monthly Membership", date: "2025-05-05", revenue: 1500, status: "pending" },
  { id: "4", client: "SWFL Eats Podcast", package: "Day Rate Session", date: "2025-05-06", revenue: 200, status: "confirmed" },
  { id: "5", client: "Waterside Wealth Mgmt", package: "Billionaire Coast - Gold", date: "2025-05-08", revenue: 1000, status: "confirmed" },
  { id: "6", client: "SunCoast Productions", package: "Day Rate Session", date: "2025-05-09", revenue: 175, status: "pending" },
  { id: "7", client: "Marco Island Realty", package: "Real Estate Session", date: "2025-05-10", revenue: 600, status: "confirmed" },
  { id: "8", client: "Naples Art Week", package: "Event Night", date: "2025-05-15", revenue: 1500, status: "pending" },
  { id: "9", client: "Island Coast Media", package: "Monthly Membership", date: "2025-05-01", revenue: 1500, status: "completed" },
  { id: "10", client: "Bonita Bay Group", package: "Corporate Package", date: "2025-04-28", revenue: 3000, status: "completed" },
];

export const MOCK_MRR = {
  studioRental: 5000,
  contentAgency: 12500,
  showSponsors: 2000,
  merch: 500,
  total: 20000,
  naplesDigitalCommission: 3200,
} as const;

export interface SocialPoint {
  week: string;
  youtube: number;
  instagram: number;
  tiktok: number;
  facebook: number;
}

export const MOCK_SOCIAL_GROWTH: SocialPoint[] = [
  { week: "W1", youtube: 125, instagram: 800, tiktok: 450, facebook: 1500 },
  { week: "W2", youtube: 140, instagram: 920, tiktok: 580, facebook: 1680 },
  { week: "W3", youtube: 162, instagram: 1050, tiktok: 720, facebook: 1850 },
  { week: "W4", youtube: 189, instagram: 1200, tiktok: 890, facebook: 2100 },
  { week: "W5", youtube: 210, instagram: 1380, tiktok: 1050, facebook: 2400 },
  { week: "W6", youtube: 238, instagram: 1520, tiktok: 1200, facebook: 2700 },
  { week: "W7", youtube: 265, instagram: 1700, tiktok: 1380, facebook: 2950 },
  { week: "W8", youtube: 290, instagram: 1850, tiktok: 1520, facebook: 3200 },
  { week: "W9", youtube: 310, instagram: 1980, tiktok: 1650, facebook: 3500 },
  { week: "W10", youtube: 325, instagram: 2050, tiktok: 1720, facebook: 3800 },
  { week: "W11", youtube: 338, instagram: 2090, tiktok: 1780, facebook: 4000 },
  { week: "W12", youtube: 340, instagram: 2100, tiktok: 1800, facebook: 4200 },
];

export interface Projection {
  month: string;
  conservative: number;
  realistic: number;
  upside: number;
}

export const MOCK_PROJECTIONS: Projection[] = [
  { month: "Month 1", conservative: 5000, realistic: 8000, upside: 12000 },
  { month: "Month 2", conservative: 9000, realistic: 14000, upside: 20000 },
  { month: "Month 3", conservative: 13500, realistic: 20000, upside: 29500 },
  { month: "Month 4", conservative: 17000, realistic: 26000, upside: 38000 },
  { month: "Month 5", conservative: 21000, realistic: 32000, upside: 45000 },
  { month: "Month 6", conservative: 26500, realistic: 38000, upside: 52000 },
  { month: "Month 12", conservative: 44000, realistic: 62000, upside: 88000 },
];

export interface RoadmapItem {
  text: string;
  done: boolean;
}

export interface RoadmapPhase {
  label: string;
  items: RoadmapItem[];
}

export const MOCK_ROADMAP: { phase1: RoadmapPhase; phase2: RoadmapPhase; phase3: RoadmapPhase } = {
  phase1: {
    label: "Days 1–30 · Fix the Foundation",
    items: [
      { text: "Offer selected — contract signed", done: true },
      { text: "Studio renovation plan + timeline agreed", done: true },
      { text: "Operator formally confirmed in role", done: true },
      { text: "Naples Digital workspace deal signed", done: true },
      { text: "Naples Digital begins full system build", done: true },
      { text: "New brand identity locked — one name, one URL", done: false },
      { text: "Studio booking calendar goes live", done: false },
      { text: "First paying studio rental clients booked", done: false },
    ],
  },
  phase2: {
    label: "Days 31–60 · Systems Go Live",
    items: [
      { text: "GHL CRM deployed + team trained", done: true },
      { text: "Cold outreach system live — first sequences sent", done: true },
      { text: "Website + SEO fully live and indexed", done: false },
      { text: "Apple Podcasts + Spotify distribution active", done: false },
      { text: "First content agency client onboarded", done: false },
      { text: "Billionaire Coast — pilot episode filmed", done: false },
      { text: "Naples Digital pod launched from studio", done: false },
      { text: "Kevin receives first profitable P&L report", done: false },
    ],
  },
  phase3: {
    label: "Days 61–90 · Scale + Momentum",
    items: [
      { text: "2–3 recurring content agency clients signed", done: false },
      { text: "Billionaire Coast — first 4 episodes published", done: false },
      { text: "Sponsor pipeline active — first conversations", done: false },
      { text: "Studio averaging $5K+/mo rental revenue", done: false },
      { text: "Merch store in development", done: false },
      { text: "Kevin reviews model — scopes Phase 2", done: false },
      { text: "All AI automations documented + handed off", done: false },
      { text: "Monthly rhythm locked — Kevin runs it passively", done: false },
    ],
  },
};

export type LeadStage =
  | "Lead Captured"
  | "Contacted"
  | "Meeting Booked"
  | "Proposal Sent"
  | "Client Won";

export const LEAD_STAGES: LeadStage[] = [
  "Lead Captured",
  "Contacted",
  "Meeting Booked",
  "Proposal Sent",
  "Client Won",
];

export interface Lead {
  id: string;
  name: string;
  type: string;
  goal: string;
  value: number;
  stage: LeadStage;
  source: string;
  daysInStage: number;
}

export const MOCK_LEADS: Lead[] = [
  { id: "1", name: "Naples Luxury Properties", type: "Real Estate Agent", goal: "Studio Rental", value: 400, stage: "Lead Captured", source: "cold email", daysInStage: 1 },
  { id: "2", name: "Coastal Financial Group", type: "Financial Advisor", goal: "Gold Sponsor", value: 1000, stage: "Contacted", source: "outreach system", daysInStage: 3 },
  { id: "3", name: "Marco Island Realty", type: "Real Estate Agent", goal: "Studio Rental", value: 600, stage: "Contacted", source: "cold email", daysInStage: 2 },
  { id: "4", name: "Fort Myers Fitness Co", type: "Local Business", goal: "Monthly Membership", value: 1500, stage: "Meeting Booked", source: "website", daysInStage: 5 },
  { id: "5", name: "Gulf Coast Mortgage", type: "Financial Advisor", goal: "Silver Sponsor", value: 500, stage: "Meeting Booked", source: "outreach system", daysInStage: 4 },
  { id: "6", name: "SWFL Eats Podcast", type: "Content Creator", goal: "Day Rate", value: 200, stage: "Proposal Sent", source: "referral", daysInStage: 6 },
  { id: "7", name: "Naples Custom Builders", type: "Home Builder", goal: "Bronze Sponsor", value: 300, stage: "Proposal Sent", source: "Kevin intro", daysInStage: 7 },
  { id: "8", name: "Island Coast Media", type: "Content Agency", goal: "Monthly Membership", value: 1500, stage: "Proposal Sent", source: "cold email", daysInStage: 3 },
  { id: "9", name: "Premier Naples Estates", type: "Real Estate Agent", goal: "Real Estate Session", value: 500, stage: "Client Won", source: "outreach", daysInStage: 0 },
  { id: "10", name: "Bonita Bay Group", type: "Corporate", goal: "Corporate Package", value: 3000, stage: "Client Won", source: "referral", daysInStage: 0 },
  { id: "11", name: "Naples Art Week", type: "Event Company", goal: "Event Night", value: 1500, stage: "Lead Captured", source: "inbound", daysInStage: 1 },
  { id: "12", name: "Waterside Wealth Mgmt", type: "Financial Advisor", goal: "Gold Sponsor", value: 1000, stage: "Contacted", source: "outreach", daysInStage: 2 },
  { id: "13", name: "SunCoast Productions", type: "Content Creator", goal: "Day Rate", value: 175, stage: "Lead Captured", source: "website", daysInStage: 1 },
  { id: "14", name: "Naples Yacht Charter", type: "Luxury Brand", goal: "Silver Sponsor", value: 500, stage: "Meeting Booked", source: "outreach", daysInStage: 3 },
];

export type EpisodeStatus =
  | "Draft"
  | "Scheduled"
  | "Recording"
  | "Transcribing"
  | "Editing"
  | "Clipped"
  | "Posted";

export type Platform = "instagram" | "tiktok" | "youtube" | "facebook";

export interface Episode {
  id: string;
  show: "Billionaire Coast" | "239 Built" | "SWFL Keys";
  title: string;
  guest: string;
  guestTitle: string;
  recordDate: string;
  status: EpisodeStatus;
  clipsCut: number;
  clipsPosted: number;
  platforms: Platform[];
}

export const MOCK_EPISODES: Episode[] = [
  { id: "1", show: "Billionaire Coast", title: "Building Naples From the Ground Up", guest: "Michael Harrington", guestTitle: "Developer", recordDate: "2025-04-20", status: "Posted", clipsCut: 5, clipsPosted: 5, platforms: ["instagram", "tiktok", "youtube", "facebook"] },
  { id: "2", show: "Billionaire Coast", title: "Private Equity in Southwest Florida", guest: "Sarah Chen", guestTitle: "PE Partner", recordDate: "2025-04-27", status: "Transcribing", clipsCut: 0, clipsPosted: 0, platforms: [] },
  { id: "3", show: "239 Built", title: "How I Turned a Food Truck Into 4 Restaurants", guest: "Marco DiSalvo", guestTitle: "Restaurateur", recordDate: "2025-04-29", status: "Editing", clipsCut: 3, clipsPosted: 1, platforms: ["instagram"] },
  { id: "4", show: "Billionaire Coast", title: "Yacht Brokerage in a Down Market", guest: "James Whitfield", guestTitle: "Yacht Broker", recordDate: "2025-05-03", status: "Scheduled", clipsCut: 0, clipsPosted: 0, platforms: [] },
  { id: "5", show: "SWFL Keys", title: "Naples Art Week Coverage", guest: "Various Artists", guestTitle: "", recordDate: "2025-05-10", status: "Scheduled", clipsCut: 0, clipsPosted: 0, platforms: [] },
  { id: "6", show: "239 Built", title: "From Contractor to Developer: Kevin's Story", guest: "Kevin (Host)", guestTitle: "Owner", recordDate: "2025-05-15", status: "Draft", clipsCut: 0, clipsPosted: 0, platforms: [] },
  { id: "7", show: "Billionaire Coast", title: "The Naples Real Estate Cycle", guest: "Diana Russo", guestTitle: "Broker", recordDate: "2025-05-17", status: "Scheduled", clipsCut: 0, clipsPosted: 0, platforms: [] },
];

// Static metadata used across multiple apps for outreach demo + dashboard.
export const OUTREACH_STATS = {
  emailsSentThisWeek: 47,
  opens: 12,
  replies: 3,
  meetingsBooked: 1,
};

export const PRICING = {
  optionA: { setup: 25000, retainer: 3000, commission: 0.10, label: "Build Heavy" },
  optionB: { setup: 15000, retainer: 3000, commission: 0.20, label: "Commission Heavy" },
  platformLow: 460,
  platformHigh: 690,
  equipmentRental: 1500,
};

// Production Railway URLs hardcoded as defaults so cross-app links work even
// when NEXT_PUBLIC_*_URL env vars aren't forwarded into the Docker build at
// Railway build time. Override via env var for local dev.
export const APP_URLS = {
  site: process.env.NEXT_PUBLIC_SITE_URL || "https://239live-site-production.up.railway.app",
  booking: process.env.NEXT_PUBLIC_BOOKING_URL || "https://booking-portal-production-883f.up.railway.app",
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard-production-b08f.up.railway.app",
  agency: process.env.NEXT_PUBLIC_AGENCY_URL || "https://agency-site-production-35a2.up.railway.app",
  outreach: process.env.NEXT_PUBLIC_OUTREACH_URL || "https://outreach-demo-production.up.railway.app",
  crm: process.env.NEXT_PUBLIC_CRM_URL || "https://crm-pipeline-production.up.railway.app",
  content: process.env.NEXT_PUBLIC_CONTENT_URL || "https://content-pipeline-production-21b7.up.railway.app",
};
