import type { Difficulty, MindHouseEvent } from './types';

export const generateMindHouseSequence = (difficulty: Difficulty): MindHouseEvent[] => {
  const events: MindHouseEvent[] = [];
  let currentCount = 0;

  let eventCount: number;
  let tempo: number;
  let allowAmount2: boolean;

  switch (difficulty) {
    case "easy":
      eventCount = 7;
      tempo = 950; // 900-1000ms average
      allowAmount2 = false;
      break;
    case "medium":
      eventCount = 12;
      tempo = 750; // 700-800ms average
      allowAmount2 = false;
      break;
    case "hard":
      eventCount = 19; // 18-20, using 19
      tempo = 575; // 500-650ms average
      allowAmount2 = true;
      break;
  }

  // Target final count range: 0-15
  const targetFinalMin = 0;
  const targetFinalMax = 15;

  for (let i = 0; i < eventCount; i++) {
    const isLast = i === eventCount - 1;
    const remainingEvents = eventCount - i - 1;

    // FIRST event is always IN
    if (i === 0) {
      const amount = allowAmount2 && Math.random() < 0.3 ? 2 : 1;
      const from: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      currentCount += amount;
      events.push({ type: 'IN', amount, from });
      continue;
    }

    // Determine if we should force IN or OUT
    let forcedType: "IN" | "OUT" | null = null;

    // If count is 0, we must go IN
    if (currentCount === 0) {
      forcedType = "IN";
    }
    // If we're near the end, try to keep count in reasonable range
    else if (isLast || remainingEvents <= 2) {
      // For last event, try to end in a reasonable range
      if (currentCount < targetFinalMin) {
        forcedType = "IN";
      } else if (currentCount > targetFinalMax) {
        forcedType = "OUT";
      }
    }

    // Determine amount (1 or 2)
    let amount = 1;
    if (allowAmount2 && !forcedType && Math.random() < 0.3) {
      // 30% chance for amount 2 in hard mode
      amount = 2;
    }

    // Determine type
    let type: "IN" | "OUT";
    if (forcedType) {
      type = forcedType;
    } else {
      // Bias towards IN for easy/medium (60-70% IN)
      // For hard, more balanced but still slightly IN-biased
      const inBias = difficulty === "hard" ? 0.55 : 0.65;
      type = Math.random() < inBias ? "IN" : "OUT";
    }

    // Ensure we never go negative
    if (type === "OUT" && currentCount === 0) {
      type = "IN";
    }

    // Apply the event and update currentCount
    if (type === "IN") {
      currentCount += amount;
    } else {
      // OUT: ensure we don't go negative
      const maxOut = Math.min(amount, currentCount);
      currentCount = Math.max(0, currentCount - maxOut);
      // If we can't take out the full amount, adjust
      if (maxOut < amount) {
        amount = maxOut;
      }
    }

    // Randomly choose direction
    const from: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';

    events.push({ type, amount, from });
  }

  // Final validation: ensure count is in reasonable range
  // If it's way out of range, adjust the last event
  if (currentCount < 0) {
    currentCount = 0;
  }
  if (currentCount > 20) {
    // If somehow we got too high, cap it by adjusting last events
    // This is a safety net
    const excess = currentCount - 15;
    for (let i = events.length - 1; i >= 0 && excess > 0; i--) {
      if (events[i].type === "IN") {
        const reduce = Math.min(excess, events[i].amount);
        events[i].amount -= reduce;
        if (events[i].amount === 0) {
          // Change to OUT if amount becomes 0
          events[i].type = "OUT";
          events[i].amount = 1;
        }
        currentCount -= reduce;
      }
    }
  }

  return events;
};

