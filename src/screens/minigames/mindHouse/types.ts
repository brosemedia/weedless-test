export type Difficulty = "easy" | "medium" | "hard";

export type EventType = "IN" | "OUT";

export interface MindHouseEvent {
  type: EventType;
  amount: number; // 1 or 2
  from: 'left' | 'right';
}

export type Phase = "intro" | "countdown" | "playing" | "answer" | "result";

