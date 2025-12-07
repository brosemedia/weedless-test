export type Article = {
  id: string;
  slug: string;
  tag: 'Strategie' | 'Wissen' | 'Selbstfürsorge' | 'Mindset';
  readMinutes: number;
  title: string;
  excerpt: string;
  content: string;
  sources: { label: string; url: string }[];
};

/**
 * Hinweis: Die Inhalte ersetzen keine medizinische Beratung.
 * Bei starker Belastung oder Krisen bitte professionelle Hilfe holen.
 * DE: Sucht & Drogen Hotline 01806 313031 (0,20 €/Anruf).
 */

export const ARTICLES: Article[] = [
  {
    id: 'suchtverlagerung',
    slug: 'suchtverlagerungen-verstehen-bekaempfen',
    tag: 'Strategie',
    readMinutes: 4,
    title: 'Suchtverlagerungen verstehen & stoppen',
    excerpt:
      'Manchmal rutscht das Verlangen von Cannabis zu anderen Dingen – hier lernst du, das früh zu merken und freundlich gegenzusteuern.',
    content: `## 🧭 Kurz gesagt
Suchtverlagerung bedeutet: Dein Kopf sucht neue „Kicks“. Das ist normal – und handhabbar. Wichtig ist, früh zu erkennen, freundlich gegenzusteuern.

## 🔍 Woran erkennst du’s?
- ✅ Du denkst **häufig** an eine andere Sache, die „Klick“ macht.
- ✅ Es fließen **immer mehr Zeit oder Geld** hinein.
- ✅ Du wirst **unruhig**, wenn es nicht geht.

## 🧠 Warum passiert das?
- Das Belohnungssystem will weiter Dopamin.
- Alte Auslöser (Stress, Langeweile) sind noch da.
- Ein kleiner Ausrutscher fühlt sich wie „alles vorbei“ an – ist er nicht.

## 🛠️ Dein 5-Schritte-Plan
1) **Wenn-Dann-Plan**: „Wenn ich gestresst bin, **dann** gehe ich 10 Minuten raus und rufe X an.“
2) **Urge Surfing (3 Min)**: Hinsetzen, atmen, Welle beobachten. Nicht kämpfen – vorbeiziehen lassen.
3) **Umgebung umbauen**: Reize weg (Apps, Snacks), Alternativen hin (Wasser, Obst, Spaziergang).
4) **Grenzen setzen**: Bildschirm-Timer, feste Zeiten, Einkaufslisten. Messbar macht locker.
5) **Menschen einbinden**: Freund:in, Gruppe, Beratung. Du musst das nicht alleine machen.

> 💬 **Mutmacher:** Ein kurzer Ausrutscher ist **Feedback**, kein Scheitern. Zurück in den Plan – weiter geht’s.`,
    sources: [
      {
        label: 'Marlatt & Gordon – Relapse Prevention (Übersicht, Modell)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/',
      },
      { label: 'CDC – Cannabis Use Disorder: Warnzeichen', url: 'https://www.cdc.gov/cannabis/health-effects/cannabis-use-disorder.html' },
      { label: 'DHS – Suchthilfeverzeichnis (DE)', url: 'https://www.dhs.de/service/suchthilfeverzeichnis/' },
    ],
  },
  {
    id: 'thc-abbau',
    slug: 'thc-abbau-im-koerper-was-passiert-wann',
    tag: 'Wissen',
    readMinutes: 6,
    title: 'THC-Abbau im Körper: Was passiert wann?',
    excerpt: 'Wie THC verarbeitet wird, wie lange es oft nachweisbar ist – und was diese Zeiten beeinflusst.',
    content: `## ⚗️ Kurz erklärt
- THC ist **fettliebend** und verteilt sich im Körper.
- In der Leber entsteht erst **11-OH-THC** (wirksam), später **THC-COOH** (nicht wirksam).
- Tests zeigen **Nutzung in einem Zeitfenster** – nicht automatisch aktuelle Wirkung.

## 🧪 Was im Körper passiert
- **Aufnahme:** Inhalieren wirkt schnell; Essen wirkt später, oft länger.
- **Umbau:** Leber wandelt THC um → Ausscheidung über Urin und Stuhl.
- **Speicher:** Häufiger Konsum = mehr Einlagerung im Fettgewebe.

## ⏱️ Typische Nachweiszeiten (Richtwerte)
- **Blut (THC):** Stunden bis < 24 h; bei Vielnutzern länger möglich.
- **Speichel:** meist 1–2 Tage.
- **Urin (THC-COOH):** wenige Tage bis mehrere Wochen (bei täglichem Konsum > 30 Tage möglich).
- **Haar:** bis ~90 Tage – zeigt Historie, nicht akute Wirkung.

> 🚗 **Wichtig für Verkehr:** Ein positiver Test beweist *nicht* automatisch Fahruntüchtigkeit. Bitte nationale Regeln beachten.

## 🎚️ Was die Dauer beeinflusst
Häufigkeit & Menge, Körperfett, Potenz, Art der Einnahme (Vape vs. Edible), Stoffwechsel, Test-Grenzwerte.

## 🧯 Mythen-Check
„Detox-Tricks“ sind nicht zuverlässig belegt. Viel Training kann THC kurzzeitig aus Fettgewebe freisetzen – das macht Tests nicht sicher negativ.`,
    sources: [
      { label: 'Huestis – Human Cannabinoid Pharmacokinetics (Review)', url: 'https://pubmed.ncbi.nlm.nih.gov/17712819/' },
      { label: 'Lucas – Pharmacokinetics & dynamics of cannabinoids', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6177698/' },
      { label: 'ADAC – Wie lange ist THC nachweisbar? (DE)', url: 'https://www.adac.de/gesundheit/gesund-unterwegs/strasse/wie-lange-ist-thc-nachweisbar/' },
      { label: 'BZgA drugcom – Fakten zu Cannabis (DE)', url: 'https://www.drugcom.de/' },
    ],
  },
  {
    id: 'cannabis-sucht',
    slug: 'warum-wird-man-suechtig-von-cannabis',
    tag: 'Wissen',
    readMinutes: 5,
    title: 'Warum wird man süchtig von Cannabis?',
    excerpt:
      'Warum sich Kiffen langsam zur Gewohnheit entwickeln kann, was Abhängigkeit bei Cannabis bedeutet und wie du das bei dir selbst beobachten kannst.',
    content: `Kennst du das? Du wolltest „nur ab und zu“ kiffen – und irgendwann merkst du: Ohne Joint fühlt sich der Tag unkomplett an. Die Frage kommt schnell: Macht Cannabis wirklich süchtig – und wenn ja, warum?

## Was heißt überhaupt „süchtig“?
„Süchtig“ klingt hart und viele denken an harte Drogen. Bei Cannabis läuft es oft leiser. Knackpunkt: Gras ist nicht mehr „nice to have“, sondern wird zu „ich brauch das jetzt“, etwa zum Runterkommen, Einschlafen oder um Gefühle wegzudrücken. Entscheidend ist weniger die Menge, sondern die Rolle, die Cannabis in deinem Alltag übernimmt.

## Warum fühlt sich Kiffen so „hilfreich“ an?
Dein Gehirn liebt Abkürzungen: Stress → Joint → Erleichterung. Dopamin markiert das als „gute Lösung“ und du wiederholst es. Je öfter du an denselben Situationen kiffst (Feierabend, vorm Schlafen, in der Clique), desto stärker wird die Verknüpfung.

## Toleranz: Wenn „wie früher“ nicht mehr reicht
Mit der Zeit entsteht Toleranz: Dein Körper gewöhnt sich an THC, also brauchst du mehr oder kiffst öfter, um den alten Effekt zu spüren. Das verstärkt das Gefühl, ohne Gras nicht wirklich abschalten oder kreativ sein zu können.

## Gefühle & Alltag: Wenn Gras zum Universal-Werkzeug wird
Viele nutzen Cannabis, um unangenehme Gefühle zu regulieren – Stress, Einsamkeit, Langeweile, Frust oder sozialen Druck. Wenn der Griff zum Joint zur Standardantwort wird, fühlt sich der Alltag ohne Cannabis leer oder „zu viel“ an. Genau dort beginnt die leise Form von Abhängigkeit.

## Entzugssymptome – auch bei Gras?
Auch wenn Cannabis als „harmlos“ gilt, können Körper und Kopf reagieren, wenn du reduzierst: schlechter Schlaf, Gereiztheit, Unruhe oder starkes Verlangen (Craving). Das ist unangenehm, aber meist vorübergehend – dein System braucht nur Zeit, sich neu einzupendeln.

## Mythos: „Cannabis macht nicht süchtig“
Cannabis ist nicht wie Heroin, aber Gewohnheiten + Emotionen + Toleranz können zusammen eine Abhängigkeit formen – mental und ein Stück weit körperlich. Das sagt nichts über deinen Charakter, sondern zeigt, wie gut dein Gehirn darin ist, Verknüpfungen zu lernen.

## Hazeless-Tipp: Mini-Check & kleines Experiment
Such dir eine Situation, in der du fast automatisch kiffst (z. B. nach der Arbeit oder vorm Schlafen). Verschieb den Joint einmal um 30–60 Minuten oder lass ihn einmal weg. Trag in der App ein, wie du dich vorher und nachher fühlst und wie stark dein Verlangen ist (0–10). Beobachte, was dein innerer Autopilot erzählt. Oft merkst du, dass der Automatismus stärker ist als der echte Bedarf – ein wichtiges Aha.
`,
    sources: [
      { label: 'NIDA – Marijuana Research Report: Is Marijuana Addictive?', url: 'https://nida.nih.gov/publications/research-reports/marijuana/marijuana-addictive' },
      { label: 'WHO – Cannabis', url: 'https://www.who.int/news-room/fact-sheets/detail/cannabis' },
      { label: 'Hasin – Epidemiology of Adult DSM-5 Cannabis Use Disorder', url: 'https://pubmed.ncbi.nlm.nih.gov/26036603/' },
    ],
  },
  {
    id: 'entzug',
    slug: 'entzugsymptome-leichter-durchstehen',
    tag: 'Selbstfürsorge',
    readMinutes: 5,
    title: 'Entzugssymptome leichter durchstehen',
    excerpt: 'Was häufig passiert, wie lange es dauert – und kleine Schritte, die sofort gut tun.',
    content: `## 🌤️ Das passiert oft – und geht vorbei
Start meist **nach 24–48 h**, Höhepunkt **Tag 2–6**, dann wird es Schritt für Schritt leichter. Unangenehm, ja – aber **vorübergehend**.

## 📋 Häufige Symptome
- Reizbarkeit, Unruhe, **Schlafprobleme**, lebhafte Träume
- Weniger Appetit, Stimmungsschwankungen
- Manchmal: Kopfweh, Schwitzen, Magen-Darm

## 🧰 Dein Soforthilfe-Set
- **🛏️ Schlaf-Basics:** Feste Zeiten, Tageslicht, Bildschirme 1 h vor dem Schlaf aus.
- **🚶 Bewegung täglich:** Ein Spaziergang reicht. Gut für Schlaf und Stimmung.
- **🥣 Regelmäßig essen & trinken:** Klein, simpel, genug Wasser.
- **🫁 Atem + Achtsamkeit (3 Min):** Langsam ein, länger aus. Welle kommen & gehen lassen.
- **✅ Mini-Aufgaben:** Duschen, Bett machen, kurze To-do – kleine Siege zählen.
- **🛟 Hilfe holen:** Freund:in, Beratung, Hotline. Stärke heißt: fragen.

## 🩺 Wann ärztlich abklären?
Sehr starker Schlafmangel, anhaltend tiefe Stimmung, Panik, Gedanken an Selbstverletzung – bitte **sofort** Hilfe holen.`,
    sources: [
      { label: 'Connor – Clinical management of cannabis withdrawal', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9110555/' },
      { label: 'Bonnet – Cannabis withdrawal syndrome (Übersicht)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5414724/' },
      { label: 'McCartney – Exercise & sleep during withdrawal', url: 'https://pubmed.ncbi.nlm.nih.gov/33078435/' },
      { label: 'DigiSucht – Digitale Beratung (DE)', url: 'https://www.suchtberatung.digital/' },
    ],
  },
  {
    id: 'dranbleiben',
    slug: 'langfristig-dranbleiben-ohne-rueckfallstress',
    tag: 'Mindset',
    readMinutes: 3,
    title: 'Langfristig dranbleiben – ohne Rückfallstress',
    excerpt: 'Ein Ausrutscher ist kein Drama. Mit einfachen Tools bleibst du freundlich auf Kurs.',
    content: `## 🔄 Lapse ≠ Relapse
Ein kurzer Ausrutscher ist **nicht** das Ende. Er zeigt: Hier braucht es einen besseren Plan. Atmen. Notieren. Zurück auf die Spur.

## 🧱 Stabil bleiben: 5 Tools
1) **Wenn-Dann-Pläne** für deine Top-Trigger.
2) **Urge Surfing** (3–5 Min): Atem spüren, Welle beobachten, ziehen lassen.
3) **Wöchentlicher Mini-Check:** Was hat geholfen? Was war schwer? Ein Satz reicht.
4) **Belohnungen:** Kleine Erfolge feiern (Sticker, Kino, gutes Essen).
5) **Support:** Menschen einbinden, Trigger reduzieren, Meilensteine feiern.

## 📝 Mini-Pläne zum Kopieren
- Wenn ich abends alleine bin, **dann** starte ich die Atemübung und schreibe 3 Dinge auf, die heute gut waren.
- Wenn die Lust kommt, **dann** trinke ich ein großes Glas Wasser und gehe 5 Minuten raus.`,
    sources: [
      { label: 'Marlatt/Larimer – Rückfallprävention (Modell)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/' },
      { label: 'Bowen et al. – Mindfulness-Based Relapse Prevention (RCT)', url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/1839290' },
      { label: 'Boness et al. – CBT bei Substanzkonsum (Review)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10572095/' },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
