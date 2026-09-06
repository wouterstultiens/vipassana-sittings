// Folds the sittings of one day into slots, and lays the slots out side by
// side where they overlap, so the calendar can draw each as a block whose
// height is its length.
import type { Sitting } from "@/lib/expand";

/** The sittings of one day that share a start instant and a length. One block on the calendar. */
export type Slot = {
  key: string;
  start: Date;
  end: Date;
  minutesFromMidnight: number;
  durationMinutes: number; // rounded to the half hour, so 65 minutes reads as one hour
  sittings: Sitting[];
};

const HALF_HOUR = 30;

export const roundLength = (minutes: number) => Math.max(HALF_HOUR, Math.round(minutes / HALF_HOUR) * HALF_HOUR);

/** Folds sittings into slots, by start and then by length. Sittings inside a slot keep their order. */
export function slotsOf(sittings: Sitting[]): Slot[] {
  const slots = new Map<string, Slot>();
  for (const s of sittings) {
    const durationMinutes = roundLength(s.rule.durationMinutes);
    const key = `${s.start.getTime()}-${durationMinutes}`;
    const slot = slots.get(key);
    if (slot) slot.sittings.push(s);
    else
      slots.set(key, {
        key,
        start: s.start,
        end: new Date(s.start.getTime() + durationMinutes * 60_000),
        minutesFromMidnight: s.minutesFromMidnight,
        durationMinutes,
        sittings: [s],
      });
  }
  return [...slots.values()].sort((a, b) => a.start.getTime() - b.start.getTime() || a.durationMinutes - b.durationMinutes);
}

export type Placed = { slot: Slot; lane: number; lanes: number };

/**
 * Gives every slot a lane, so slots that overlap in time sit side by side.
 * Slots that overlap nothing get the full width. Expects slots in start order.
 */
export function placeSlots(slots: Slot[]): Placed[] {
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  const close = () => {
    for (const p of cluster) p.lanes = laneEnds.length;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const slot of slots) {
    const start = slot.start.getTime();
    if (laneEnds.length && laneEnds.every((end) => end <= start)) close();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = slot.end.getTime();
    cluster.push({ slot, lane, lanes: 0 });
  }
  close();
  return out;
}
