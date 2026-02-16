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
    id: 'suchtverlagerung-stoppen',
    slug: 'suchtverlagerung-verstehen-und-stoppen',
    tag: 'Wissen',
    readMinutes: 6,
    title: 'Suchtverlagerung verstehen 🧠',
    excerpt:
      'Was Suchtverlagerung bedeutet, woran du sie erkennst und wie du mit kleinen Schritten gegensteuerst, ohne dich fertigzumachen.',
    content: `## Suchtverlagerung verstehen 🧠

Wenn du weniger kiffen oder aufhören willst, arbeitet dein Gehirn im Hintergrund auf Hochtouren. Manchmal zeigt sich das so, dass ein anderes Verhalten plötzlich „nach vorne rutscht“: mehr zocken, mehr scrollen, mehr Süßes, mehr Alkohol, mehr Arbeit. Das nennt man **Suchtverlagerung**.

Wichtig: Das heißt nicht, dass du „versagt“ hast – es heißt, dass dein System gerade versucht, mit Stress klarzukommen.



## Was Suchtverlagerung eigentlich ist

Suchtverlagerung bedeutet:
Du reduzierst eine Gewohnheit (z. B. Cannabis) – und dein Gehirn sucht sich unbewusst etwas anderes, das ähnlich wirkt:

- etwas, das dich kurz beruhigt
- oder dich ablenkt
- oder dir einen schnellen „Kick“ gibt

Typische Beispiele:

- Statt kiffen: viel mehr naschen oder Energydrinks
- Statt kiffen: stundenlang Social Media, Serien, Gaming
- Statt kiffen: häufiger Alkohol, Nikotin, Glücksspiel

Es geht nicht darum, ob diese Dinge „verboten“ sind. Entscheidend ist:
**Hast du noch das Gefühl, frei zu entscheiden – oder fühlt es sich eher nach Zwang an?**



## Warum dein Gehirn das macht

Dein Gehirn liebt zwei Dinge besonders:

- **Sofortige Belohnung** („Ich fühl mich jetzt kurz besser“)
- **Vorhersehbarkeit** („Das kenne ich, das funktioniert“)

Wenn Cannabis wegfällt oder weniger wird, entsteht eine Lücke:

- Gefühle, die vorher „weggedrückt“ wurden, tauchen auf
- Langeweile, innere Unruhe oder Stress werden deutlicher
- Das Belohnungssystem sucht etwas, das schnell Entlastung bringt

Suchtverlagerung ist also eine **Strategie des Gehirns, mit Unwohlsein umzugehen** – nur leider nicht immer auf eine gesunde Art.



## Woran du merkst, dass du gerade verlagerst

Frag dich mal ehrlich:

📌 „Mache ich das jetzt, weil ich es wirklich will – oder weil ich etwas nicht fühlen will?“  

📌 „Ist das noch Genuss – oder schon Automatismus?“ 
 
📌 „Wie würde es sich anfühlen, das heute einmal wegzulassen?“ (Panik / starke Unruhe = Hinweis)

Wenn du merkst, dass ein anderes Verhalten plötzlich…

- deutlich häufiger wird
- schwer zu stoppen ist
- sich eher nach „Muss“ als nach „Lust“ anfühlt

…dann könnte Suchtverlagerung im Spiel sein.



## Wie du gegensteuern kannst ✨

Du musst nicht perfekt sein. Klein, bewusst, neugierig – das reicht. Einige Ideen:

1. **Beobachten statt verurteilen**  
   Nimm 1–2 Tage nur wahr, **wann** du zu „Ersatz-Dingen“ greifst. Uhrzeit, Stimmung, Situation. Kein Urteil, nur Notizen.
2. **Gefühl + Bedürfnis checken**  
   Stell dir kurz die Frage:
   - „Was fühle ich gerade?“ (z. B. einsam, gestresst, leer)
   - „Was bräuchte ich eigentlich?“ (Kontakt, Pause, Bewegung, Ruhe)
3. **Mini-Alternativen testen**  
   Statt sofort zur Ersatzhandlung zu greifen, probier **eine kleine andere Sache vorher**:
   - 5 tiefe Atemzüge oder kurz auf den Balkon
   - 2 Minuten strecken, bewegen, Wasser trinken
   - Einer Person schreiben, die dir guttut  
     Wenn du danach *immer noch* zocken/snacken willst: okay. Du hast trotzdem geübt, anders zu reagieren.
4. **Genuss vs. Flucht unterscheiden**  
   Erlaub dir Genuss – aber bewusst.
   - Genuss: „Ich gönn mir das jetzt bewusst, und danach ist gut.“
   - Flucht: „Ich will nur weg von mir selbst.“  
     Je öfter du diesen Unterschied wahrnimmst, desto freier wirst du.



## Du bist nicht „süchtig auf alles“

Wenn sich gerade viele Dinge verschieben, kann schnell der Gedanke kommen:

> „Super, jetzt bin ich auf alles süchtig…“

Die Realität ist oft:

- Dein System ist im **Umbruch**
- Es lernt **neue Wege**, mit Gefühlen, Stress und Langeweile umzugehen
- Suchtverlagerung ist ein **Hinweis**, wo du noch Unterstützung brauchst – kein Urteil über deinen Charakter

Du darfst Schritt für Schritt lernen, wie du mit dir selbst umgehen kannst, ohne dich ständig betäuben zu müssen. Und jeder Moment, in dem du neugierig hinschaust statt dich fertigzumachen, ist bereits ein Fortschritt. 💚`,
    sources: [
      {
        label: 'Hazelden Betty Ford – What Is Cross Addiction?',
        url: 'https://www.hazeldenbettyford.org/articles/what-is-cross-addiction',
      },
      {
        label: 'Kim et al. (2021): A systematic review of addiction substitution in recovery',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0272735821001264',
      },
      {
        label: 'American Addiction Centers – Are Transfer Addiction and Cross Addiction Supported by Science?',
        url: 'https://americanaddictioncenters.org/blog/transfer-addiction',
      },
      {
        label: 'Bundesministerium für Gesundheit – Sucht und Drogen',
        url: 'https://www.bundesgesundheitsministerium.de/themen/praevention/gesundheitsgefahren/sucht-und-drogen.html',
      },
      {
        label: 'Deutsche Hauptstelle für Suchtfragen – Jahrbuch Sucht 2025',
        url: 'https://www.dhs.de/fileadmin/user_upload/pdf/Jahrbuch_Sucht/JBSucht2025_komplett_WEB.pdf',
      },
    ],
  },
  {
    id: 'rem-rebound-weed-pause',
    slug: 'rem-rebound-nach-weed-pause',
    tag: 'Selbstfürsorge',
    readMinutes: 6,
    title: 'Weed-Pause & krasse Träume: Was passiert?',
    excerpt:
      'Warum nach einer Weed-Pause intensive Träume zurückkommen, was REM-Rebound bedeutet und wie du mit einfachen Routinen und Traum-Notizen entspannter durch die Phase gehst.',
    content: `## Wenn du nach einer Weed-Pause plötzlich wieder krass träumst

Wenn du nach einer Weed-Pause plötzlich wieder krass träumst: 
Nein, du wirst nicht verrückt – dein Gehirn holt nur nach, was lange unterdrückt war. 🌙✨



## Was Kiffen mit deinem Schlaf macht

Cannabis kann sich ziemlich stark auf deinen Schlaf auswirken – vor allem auf die **REM-Phase**, also die Schlafphase, in der wir intensiv träumen.

Wenn du regelmäßig kiffst, passiert oft:

- Du schläfst vielleicht schneller ein
- Du hast das Gefühl, „träumst kaum“ oder erinnerst dich selten an Träume
- Die Tiefschlafphasen können sich verändern, die Traumphasen werden oft **gedrückt**

Dein Gehirn ist aber nicht „aus“, es verschiebt nur die Balance der Schlafphasen. Die Traumarbeit wird quasi in den Hintergrund gedrängt.



## Warum du beim Aufhören wieder mehr träumst

Wenn du weniger oder gar nicht mehr kiffst, passiert häufig das Gegenteil:
Dein Körper nutzt die Gelegenheit, um nachzuholen, was lange zu kurz kam.

Typisch ist dann:

REM-Rebound**: Dein Gehirn holt Traumphasen nach → mehr REM-Schlaf

Träume werden **intensiver, bunter, emotionaler**

Du erinnerst dich plötzlich an viele Details – manchmal auch an Albträume

Das kann sich erst mal richtig überwältigend anfühlen. Aber:

👉 Das ist **kein Zeichen**, dass mit dir etwas nicht stimmt.
Es ist ein Zeichen, dass dein Schlafsystem wieder „hochfährt“.



## Fühlt sich komisch an? Das ist normal.

Viele berichten in dieser Phase:

* „Ich träume mega viel und wache öfter auf.“
* „Die Träume sind so real, das verunsichert mich.“
* „Manche Träume triggern alte Themen oder Ängste.“

Wichtig zu wissen:

* Dein Gehirn nutzt Träume, um **Emotionen zu sortieren** und Erlebnisse zu verarbeiten.
* Wenn du lange betäubt hast (egal womit), kommt beim „Auftauen“ manchmal viel auf einmal.
* Das ist unangenehm – aber es ist auch ein Zeichen von **Heilung und Anpassung**, nicht von „kaputt“.



## Was dir in dieser Traum-Phase helfen kann 😴

Du musst da nicht einfach nur durchhalten – du kannst aktiv für mehr Sicherheit sorgen:

1. Abend-Routine beruhigen

* Helle Screens (Handy, PC, TV) rechtzeitig dimmen oder weglegen
* Kein Doomscrolling direkt vorm Schlafen
* Etwas, das dich runterbringt: ruhige Musik, Lesen, Dehnen, Atemübungen

2. Träume „parken“

Wenn Träume zu intensiv sind, hilft es manchmal, ihnen **einen Platz zu geben**:

* Schreibe morgens kurz auf, was du geträumt hast – nur ein paar Stichpunkte
* Ergänze 1 Satz: „Was brauche ich heute nach diesem Traum?“ (z. B. Ruhe, Bewegung, Kontakt)
* So bist du nicht ausgeliefert, sondern kommst in eine **aktive, handelnde Rolle**

3. Dich selbst beruhigen, statt zu bewerten

Statt „Boah, was stimmt nicht mit mir?“ lieber:

* „Okay, mein Gehirn arbeitet. Das ist anstrengend, aber auch ein Zeichen, dass sich etwas neu sortiert.“
* „Das fühlt sich gerade krass an – und ich darf es Schritt für Schritt angehen.“

Kurze Selbstberuhigungs-Tools im Bett:

* Hand auf Brust oder Bauch legen und ein paar langsame Atemzüge
* 5 Dinge im Raum benennen, die du siehst → das holt dich zurück ins Hier und Jetzt



## Wann du dir Unterstützung holen darfst

Auch wenn viel davon normal ist:
Du musst da nicht allein durch, wenn es dich zu sehr belastet.

Hol dir Unterstützung, wenn zum Beispiel:

* du durch Träume über Wochen kaum schlafen kannst
* alte Traumata oder sehr belastende Erinnerungen hochkommen
* du merkst: „Allein krieg ich das gerade nicht gut geregelt.“

Hausärzt:innen, Therapeut:innen oder Suchtberatungen sind genau dafür da – nicht, um dich zu verurteilen, sondern um dir Optionen zu zeigen.


## Fazit: Deine Träume sind ein Zeichen, dass sich etwas bewegt

Wenn du weniger oder gar nicht mehr kiffst und plötzlich wieder träumst, ist das:

* kein Rückschritt
* kein Beweis, dass du „zu sensibel“ bist
* sondern ein Signal: Dein Gehirn arbeitet wieder freier.

Du darfst diese Phase als Hinweis sehen:
👉 „Mein Körper und mein Kopf stellen sich um – ich bin auf dem Weg.“ 🌱💤`,
    sources: [],
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
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
