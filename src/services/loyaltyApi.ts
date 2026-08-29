import { httpRequest } from '@/services/http';
import type {
  LoyaltyRewardsPage,
  LoyaltyTransactionsPage,
  LoyaltyWallet,
} from '@/types/loyalty';

const LOYALTY_PROXY = '/api/loyalty';

export function getLoyaltyWallet(token: string): Promise<LoyaltyWallet> {
  return httpRequest<LoyaltyWallet>(`${LOYALTY_PROXY}/wallet`, { token });
}

export function getLoyaltyRewards(
  token: string,
  restaurantId?: number
): Promise<LoyaltyRewardsPage> {
  const query = restaurantId ? `?restaurant_id=${encodeURIComponent(String(restaurantId))}` : '';
  return httpRequest<LoyaltyRewardsPage>(`${LOYALTY_PROXY}/rewards${query}`, { token });
}

export function getLoyaltyTransactions(
  token: string,
  cursor = '',
  limit = 20
): Promise<LoyaltyTransactionsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return httpRequest<LoyaltyTransactionsPage>(`${LOYALTY_PROXY}/transactions?${params}`, { token });
}
