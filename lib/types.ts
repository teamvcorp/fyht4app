import type { ObjectId } from "mongodb";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "past_due"
  | "canceled";

export interface ChildProfile {
  name?: string;
  ageYears?: number;
}

export type PrincipleStatus = "locked" | "learning" | "mastered";

export interface UserPrincipleProgress {
  status: PrincipleStatus;
  /** Self-reported per-factor practice, keyed by factor name. */
  factors?: Record<string, boolean>;
  source?: "self" | "taekwondo";
  updatedAt?: Date;
}

export interface UserProgress {
  /** Keyed by step (1..5). */
  principles: Record<number, UserPrincipleProgress>;
}

// --- Taekwondo program (paced lessons + belt testing) ---

export interface LessonProgress {
  /** When the user first opened this lesson — its week starts here. */
  firstAccessedAt: string;
  /** Number of watches completed to the end. */
  watchCount: number;
  completedAt?: string;
}

export type BeltTestStatus =
  | "none"
  | "paid"
  | "submitted"
  | "passed"
  | "failed";

export interface BeltTest {
  status: BeltTestStatus;
  /** $20 testing fee paid (once; retakes are free). */
  paidAt?: string;
  submissionUrl?: string;
  submissionPathname?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

export interface TaekwondoProgress {
  /** Tiers (steps) the user is enrolled in. */
  enrolledTiers: number[];
  /** Per-lesson progress, keyed "t{tier}b{belt}l{lesson}". */
  lessons: Record<string, LessonProgress>;
  /** Per-belt test state, keyed "t{tier}b{belt}". */
  beltTests: Record<string, BeltTest>;
}

export interface UserDoc {
  _id?: ObjectId;
  name?: string;
  email: string;
  passwordHash?: string;
  image?: string;
  emailVerified?: Date | null;
  isAdmin?: boolean;
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatus;
  /** Tracks the single free question allowed per calendar day (UTC). */
  freeUse?: { date: string; count: number };
  /** Position on the 5-rung Guiding Principles ladder. */
  progress?: UserProgress;
  /** Taekwondo program state (enrollment, lesson pacing, belt tests). */
  taekwondo?: TaekwondoProgress;
  /** Tiers (steps) whose book the user has purchased ($25 each). */
  booksOwned?: number[];
  children?: ChildProfile[];
  createdAt?: Date;
}

// --- Guiding Principles (the 5-rung ladder / Taekwondo tiers) ---

export interface PrincipleFactor {
  name: string;
  description: string;
}

export interface BeltLesson {
  name: string;
  focus?: string;
  /** The written lesson instruction (text section). */
  instruction?: string;
  /** Private Vercel Blob URL of the uploaded video clip. */
  videoUrl?: string;
  /** Blob pathname — used to mint signed playback URLs. */
  videoPathname?: string;
}

export interface Belt {
  name: string;
  lessons: BeltLesson[];
}

export interface PrincipleBook {
  title: string;
  author?: string;
  purchaseUrl?: string;
  /** Note on the age-matched protagonist for this book's journey. */
  protagonistNote?: string;
}

/**
 * A situational rule that tells the coach how to apply this principle in a
 * specific context (e.g. situation: "child melts down in public", rule:
 * "remove the audience first, name the feeling, then the limit").
 */
export interface PrincipleRule {
  situation: string;
  rule: string;
}

export interface Principle {
  _id?: ObjectId;
  /** 1..5, unique. Also the Taekwondo Tier number. */
  step: number;
  title: string;
  /** What the principle is really about, in plain terms. */
  about: string;
  /** The multi-factor make-up (e.g. Emotions / Peer pressure / Environment). */
  factors: PrincipleFactor[];
  /** Observable signs the principle has been learned. */
  masterySigns: string[];
  /** Tells in behavior/questions that reveal it is NOT yet learned. */
  notLearnedTells: string[];
  /** Concrete practice methods (e.g. "step to the doorway and announce the room + why"). */
  trainingMethods: string[];
  /** Situational rules guiding how the coach applies this principle per context. */
  rules: PrincipleRule[];
  book: PrincipleBook;
  tier: { priceCents: number; belts: Belt[] };
  updatedAt?: Date;
}

export interface CodexEntry {
  _id?: ObjectId;
  title: string;
  /** Which Guiding Principle (step 1..5) this entry belongs to. */
  step: number;
  /** The core behavioral lesson this entry teaches. */
  principle: string;
  ageMin: number;
  ageMax: number;
  /** Optional secondary tags for search. */
  topics?: string[];
  /** Keywords used to match a free-text question to this entry. */
  triggers: string[];
  /** Concrete guidance the coach should ground "Do Now"/"Do Later" in. */
  guidance: string;
  /** The science / "why it works" used to ground "Go Think". */
  deepInsight: string;
  references?: string[];
}

export interface RecommendedBook {
  step: number;
  principleTitle: string;
  title: string;
  author?: string;
  url?: string;
}

/** The structured answer returned by the coach engine to the UI. */
export interface CoachResponse {
  /** Immediate action. Must begin with "Listen up, ". */
  doNow: string;
  /** Consistency + maintenance guidance. */
  doLater: string;
  /** The science for curious minds. */
  goThink: string;
  /** Child age extracted from the question. */
  ageYears?: number;
  /** The principle (step) the question maps to. */
  targetStep?: number;
  /** The rung actually taught — prerequisite-aware (lowest unlearned <= target). */
  routedStep?: number;
  routedPrincipleTitle?: string;
  /** Shown when routed below target ("build X first because…"). */
  routedReason?: string;
  /** The subject this answer is about (first name). */
  subjectName?: string;
  recommendedBook?: RecommendedBook;
  taekwondoUpsell: boolean;
  /** False => the question fell outside the codex; UI shows an honest message. */
  groundedInCodex: boolean;
  matchedCodexIds: string[];
}

export interface ConversationDoc {
  _id?: ObjectId;
  userId: string;
  question: string;
  response: CoachResponse;
  // Denormalized for per-subject pattern queries.
  subjectId?: string;
  subjectName?: string;
  routedStep?: number;
  targetStep?: number;
  createdAt: Date;
}

/** A line of advice the Master speaks at random on the landing. */
export interface MasterAdvice {
  _id?: ObjectId;
  text: string;
  /** Public Vercel Blob URL of an optional pre-recorded voice clip. */
  audioUrl?: string;
  audioPathname?: string;
  enabled: boolean;
  createdAt: Date;
}

/** A person the user asks about (a child, etc.). One user → many subjects. */
export interface SubjectDoc {
  _id?: ObjectId;
  userId: string;
  firstName: string;
  ageYears: number;
  /** Their own ladder progress (same shape as a user's). */
  progress?: UserProgress;
  createdAt: Date;
}
