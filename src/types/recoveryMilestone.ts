export type RecoveryMilestone = {
  id: string;
  timeLabel: string;        // e.g. "Tag 2–6", "Woche 3–4", "3 Monate"
  title: string;            // kurzer Titel auf der Karte
  subtitle: string;         // 1–2 Zeilen auf der Karte
  emoji?: string;           // optional Icon/Emoji
  detailTitle: string;      // Titel im Modal
  detailBody: string;       // mehrzeiliger Text im Modal, mit \n\n für Absatz-Trennung
  sources?: { label: string; url: string }[];
  // Intern für Fortschrittsberechnung
  day: number;              // Tag, an dem dieser Meilenstein erreicht wird
};

