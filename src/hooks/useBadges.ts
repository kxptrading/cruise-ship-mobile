import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { EmojiKey } from '../components/FluentEmoji'
import type { DailyLog } from '../types'

export interface Badge {
  id:       string
  label:    string
  emojiKey: EmojiKey
  color:    string
  desc:     string
  earned:   boolean
}

const DEFS: Omit<Badge, 'earned'>[] = [
  { id: 'first_log',     label: 'First Log',      emojiKey: 'open_book',      color: '#0EA5E9', desc: 'Write your first daily log entry' },
  { id: 'port_explorer', label: 'Port Explorer',   emojiKey: 'round_pushpin',  color: '#0D9488', desc: 'Visit 3 or more ports' },
  { id: 'foodie',        label: 'Foodie',          emojiKey: 'fork_and_knife', color: '#F43F5E', desc: 'Log 5 or more meals' },
  { id: 'top_rated',     label: 'Top Rated',       emojiKey: 'star',           color: '#F59E0B', desc: 'Average daily rating of 4+ stars' },
  { id: 'entertained',   label: 'Entertained',     emojiKey: 'performing_arts',color: '#7C3AED', desc: 'Log 3 or more shows' },
  { id: 'on_budget',     label: 'On Budget',       emojiKey: 'money_bag',      color: '#0369A1', desc: 'Stay within your budget' },
  { id: 'photographer',  label: 'Photographer',    emojiKey: 'camera',         color: '#0D9488', desc: 'Upload at least one photo' },
  { id: 'full_house',    label: 'Full House',      emojiKey: 'trophy',         color: '#F59E0B', desc: 'Log every night of the voyage' },
]

interface Options {
  voyageId:    string | null
  dailyLogs:   DailyLog[]
  totalNights: number
}

export function useBadges({ voyageId, dailyLogs, totalNights }: Options): Badge[] {
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!voyageId) return
    let cancelled = false

    ;(async () => {
      const earned = new Set<string>()

      // ── Client-side checks (from dailyLogs already loaded) ────────────────
      const filled = dailyLogs.filter(d => d.highlights || d.bestMoment)
      if (filled.length >= 1) earned.add('first_log')
      if (totalNights > 0 && filled.length >= totalNights) earned.add('full_house')

      const ratings = dailyLogs.map(d => d.rating).filter(r => r > 0)
      if (ratings.length > 0) {
        const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length
        if (avg >= 4) earned.add('top_rated')
      }

      // ── DB count queries (all in parallel) ────────────────────────────────
      const [portRes, foodRes, entRes, photoRes, budgetRes, itemsRes] = await Promise.all([
        supabase
          .from('itinerary')
          .select('port', { count: 'exact', head: true })
          .eq('voyage_id', voyageId)
          .not('port', 'is', null)
          .not('port', 'ilike', '%sea%'),
        supabase
          .from('food_logs')
          .select('id', { count: 'exact', head: true })
          .eq('voyage_id', voyageId),
        supabase
          .from('entertainment_log')
          .select('id', { count: 'exact', head: true })
          .eq('voyage_id', voyageId),
        supabase
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('voyage_id', voyageId),
        supabase
          .from('budget')
          .select('total_budget')
          .eq('voyage_id', voyageId)
          .single(),
        supabase
          .from('budget_items')
          .select('amount')
          .eq('voyage_id', voyageId),
      ])

      if ((portRes.count  ?? 0) >= 3) earned.add('port_explorer')
      if ((foodRes.count  ?? 0) >= 5) earned.add('foodie')
      if ((entRes.count   ?? 0) >= 3) earned.add('entertained')
      if ((photoRes.count ?? 0) >= 1) earned.add('photographer')

      // On Budget — needs both a set budget and items, total ≤ budget
      if (budgetRes.data?.total_budget && itemsRes.data?.length) {
        const budget = parseFloat(String(budgetRes.data.total_budget))
        const spent  = (itemsRes.data as { amount: number | null }[])
          .reduce((s, i) => s + (i.amount ?? 0), 0)
        if (budget > 0 && spent <= budget) earned.add('on_budget')
      }

      if (!cancelled) setEarnedIds(earned)
    })()

    return () => { cancelled = true }
  }, [voyageId, dailyLogs.length, totalNights])

  return DEFS.map(def => ({ ...def, earned: earnedIds.has(def.id) }))
}
