export interface Company {
  industry?: string;
  industryDetail?: string;
  prefecture?: string;
  city?: string;
  founded?: string;
  employees?: string;
  revenue?: string;
  profit?: string;
  cashflow?: string;
  borrowing?: string;
  challenges?: string[];
  employment?: string;
  certifications?: string[];
  subsidyExp?: string;
  memo?: string;
}

export interface NameIdea {
  label: string;
  text: string;
  detail?: string;
}

export interface ReviewPoint {
  num: string;
  label: string;
  desc: string;
  weight: "高" | "中" | "低";
}

export interface RejectionReason {
  reason: string;
  detail: string;
}

export interface AdoptionPattern {
  tag: string;
  example: string;
  applicability: string;
}

export interface Section {
  id: string;
  label: string;
  sub: string;
}

export interface Subsidy {
  id?: string;
  name: string;
  org: string;
  layer?: string;
  maxAmount: string;
  rate: string;
  deadline: number;
  deadline_date?: string;
  score: number;
  score_base?: number;
  relevanceHits?: number;
  status: string;
  summary?: string;
  strategy?: string;
  nameIdeas?: NameIdea[];
  nameIdea?: string;
  tags?: string[];
  eligible?: string;
  expense?: string;
  difficulty?: string;
  reason?: string;
  url?: string;
  form_url?: string;
  policyBackground?: string;
  reviewPoints?: ReviewPoint[];
  rejectionReasons?: RejectionReason[];
  adoptionPatterns?: AdoptionPattern[];
  hiddenPoints?: string[];
  sections?: Section[];
  prefecture?: string;
  city?: string;
  target_area?: string;
  is_active?: boolean;
}

export interface SubsidiesByLayer {
  national: Subsidy[];
  prefecture: Subsidy[];
  city: Subsidy[];
  chamber: Subsidy[];
  other: Subsidy[];
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface Question {
  id: string;
  label: string;
  sub: string;
  type: "choice" | "choice_dynamic" | "scroll_list" | "scroll_city" | "chips" | "textarea";
  opts?: string[];
}
