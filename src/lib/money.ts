import type { Transaction } from '@/types'

export function balanceOf(profileId: string, txns: Transaction[]): number {
  return txns
    .filter((t) => t.profileId === profileId)
    .reduce((sum, t) => sum + t.amount, 0)
}

/** Spill penalty = half of the milestone's (original) reward. */
export function spillPenalty(reward: number): number {
  return reward / 2
}

/** Bank rule: can only withdraw a positive amount up to the current balance. */
export function canWithdraw(balance: number, amount: number): boolean {
  return amount > 0 && amount <= balance
}
