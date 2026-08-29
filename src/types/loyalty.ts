export interface LoyaltyWallet {
  status: string;
  timezone: string;
  available_points: number;
  pending_points: number;
  reserved_points: number;
  debt_points: number;
  lifetime_earned_points: number;
  updated_at?: string;
}

export interface LoyaltyReward {
  reward_id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  scope: 'GLOBAL_MANGAALE' | 'RESTAURANT';
  restaurant_id?: number;
  points_cost: number;
  effect?: Record<string, unknown>;
  funding_source: 'MANGAALE' | 'RESTAURANT' | 'SHARED';
  policy_version: string;
  starts_at?: string;
  ends_at?: string;
}

export interface LoyaltyTransaction {
  ledger_id: string;
  type: string;
  available_delta: number;
  pending_delta: number;
  reserved_delta: number;
  debt_delta: number;
  reference_type: string;
  reference_id: string;
  order_id?: string;
  restaurant_id?: number;
  campaign_id?: string;
  reward_id?: string;
  funding_source: 'MANGAALE' | 'RESTAURANT' | 'SHARED' | 'NONE';
  policy_version: string;
  expires_at?: string;
  occurred_at: string;
  created_at: string;
}

export interface LoyaltyRewardsPage {
  rewards: LoyaltyReward[];
}

export interface LoyaltyTransactionsPage {
  transactions: LoyaltyTransaction[];
  next_cursor: string;
}
