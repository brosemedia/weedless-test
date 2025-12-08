# KPI-Refresh & Cloud-Sync (Dashboard)

## Ziel
- Live-Updates nur im Vordergrund, trotzdem korrekte Werte nach Re-Entry.
- Fortschrittsbalken exakt pro Schritt (Cent/Gramm/Minute).
- Fokussiertes, sparsames Cloud-Sync.

## Laufzeitverhalten (LiveKpiGrid)
- Ticker-FPS wird pausiert, wenn Screen nicht fokussiert oder AppState != `active`.
- Bei Fokus/Active wird sofort ein Refresh mit `Date.now()` angestoßen, sodass Werte und Balken direkt springen.
- Fortschrittsbalken nutzen `progressModuloPrecise`, das Drift vermeidet und bei jedem Schritt sauber neu startet.

## Cloud-Sync
- Bei Fokus/Active wird (max. alle 2 Minuten) `syncAllData(profile, dayLogs, pauses)` aufgerufen.
- Consent wird in `syncAllData` geprüft; bei keiner Zustimmung passiert kein Upload.
- Fehler werden geloggt, blockieren aber die UI nicht.

## Anpassung / Feintuning
- Sync-Intervall: `SYNC_INTERVAL_MS` in `LiveKpiGrid` anpassen.
- Live-Ticker-FPS: im selben File in `liveTickerFps` anpassen (z.B. 1 FPS im Vordergrund).
- Schrittgrößen der Balken: `progressModuloPrecise` wird pro KPI in `src/lib/kpis.ts` mit dem jeweiligen Schritt aufgerufen (Geld 0.01, Gramm 0.001, usw.).

