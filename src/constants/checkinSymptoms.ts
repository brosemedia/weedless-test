export type CheckinSymptomSectionId = 'physical' | 'emotional' | 'thoughts' | 'behavior' | 'stable';

export type CheckinSymptomId =
  | 'sweating'
  | 'shaking'
  | 'headache'
  | 'stomach'
  | 'sleep_trouble'
  | 'irritability'
  | 'restlessness'
  | 'sadness'
  | 'emptiness'
  | 'anxiety'
  | 'overwhelm'
  | 'lonely'
  | 'craving'
  | 'rumination'
  | 'minimizing'
  | 'bargaining'
  | 'focus'
  | 'withdrawal'
  | 'phone_overuse'
  | 'ok_body'
  | 'ok_emotion';

export type SymptomSection = {
  id: CheckinSymptomSectionId;
  label: string;
  emoji: string;
  items: { id: CheckinSymptomId; label: string }[];
};

export const CHECKIN_SYMPTOM_SECTIONS: SymptomSection[] = [
  {
    id: 'physical',
    emoji: '🩺',
    label: 'Körperlich',
    items: [
      { id: 'sweating', label: 'Schwitzen / Unruhe' },
      { id: 'shaking', label: 'Zittern / Nervosität' },
      { id: 'headache', label: 'Kopfschmerzen' },
      { id: 'stomach', label: 'Magen / Übelkeit' },
      { id: 'sleep_trouble', label: 'Schlafprobleme' },
    ],
  },
  {
    id: 'emotional',
    emoji: '💭',
    label: 'Gefühle & Stimmung',
    items: [
      { id: 'irritability', label: 'Reizbarkeit' },
      { id: 'restlessness', label: 'Innere Unruhe' },
      { id: 'sadness', label: 'Traurigkeit' },
      { id: 'emptiness', label: 'Leere / Sinnlosigkeit' },
      { id: 'anxiety', label: 'Angst / Anspannung' },
      { id: 'overwhelm', label: 'Überforderung' },
      { id: 'lonely', label: 'Einsamkeit' },
    ],
  },
  {
    id: 'thoughts',
    emoji: '🧠',
    label: 'Gedanken an Konsum',
    items: [
      { id: 'craving', label: 'Starkes Craving' },
      { id: 'rumination', label: 'Viele Gedanken an Konsum' },
      { id: 'minimizing', label: 'Verharmlosende Gedanken' },
      { id: 'bargaining', label: 'Mit mir selbst verhandeln' },
    ],
  },
  {
    id: 'behavior',
    emoji: '🚦',
    label: 'Verhalten & Fokus',
    items: [
      { id: 'focus', label: 'Konzentrationsprobleme' },
      { id: 'withdrawal', label: 'Rückzug / Isolation' },
      { id: 'phone_overuse', label: 'Mehr Handy / Social Media' },
    ],
  },
  {
    id: 'stable',
    emoji: '🧘',
    label: 'Neutral / Positiv',
    items: [
      { id: 'ok_body', label: 'Körperlich okay' },
      { id: 'ok_emotion', label: 'Emotional eher stabil' },
    ],
  },
];

