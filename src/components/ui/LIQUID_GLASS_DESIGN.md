# Liquid Glass Design System – Hazeless

## Übersicht

Das „Liquid Glass"-Design orientiert sich am visuellen Stil von iOS 26 (Apple WWDC 2025). Es zeichnet sich durch transparente, glasartige Oberflächen aus, die durch Blur-Effekte, halbtransparente Hintergründe und subtile Lichtreflexionen Tiefe und Eleganz erzeugen.

## Kernprinzipien

### 1. Blur-Effekte
- **Primär**: `expo-blur` mit mittlerer bis hoher Intensität (60–95)
- **iOS-Tints**: `systemMaterial`, `systemThickMaterial` für native Integration
- **Mehrschichtig**: Kombination aus zwei Blur-Layern für mehr Tiefe

### 2. Halbtransparente Hintergründe
- **Light Mode**: `rgba(255, 255, 255, 0.75)` – helle, freundliche Glasoptik
- **Dark Mode**: `rgba(30, 45, 35, 0.65)` – dunkles, tiefes Glas
- **Overlay-Gradienten**: Subtile Farbverläufe für „flüssigen" Effekt

### 3. Borders & Highlights
- **Hairline-Border**: 0.5–1px Breite
- **Border-Farbe**: Halbtransparentes Weiß (`rgba(255, 255, 255, 0.25)`)
- **Top-Highlight**: 1–2px heller Streifen am oberen Rand (Lichtreflex)
- **Inner Glow**: Subtiler innerer Schein für 3D-Effekt

### 4. Border-Radius
- **Karten/Surfaces**: 20–24px (weich, modern)
- **Buttons**: 16–20px oder `pill` (999px) für Pill-Buttons
- **Header**: Nur untere Ecken gerundet oder komplett gerundet

### 5. Schatten
- **iOS-optimiert**: Weicher, großer Spread
- **Farbe**: Leicht getönt nach Primärfarbe oder Schwarz
- **Beispiel**: `shadowRadius: 16, shadowOpacity: 0.15`

### 6. Dark/Light Mode Kompatibilität
- Alle Glas-Komponenten reagieren automatisch auf das Theme
- Farben und Transparenzen werden dynamisch angepasst
- Blur-Tints wechseln zwischen `light` und `dark`

## Komponenten

### GlassSurface
Container für jede glasige Fläche. Umschließt Inhalte mit Blur, Border und Transparenz.

### GlassButton
Interaktiver Button mit Glas-Optik. Pill-förmig, hoher Kontrast für Lesbarkeit.

### GlassHeader
Navigationsleiste im iOS-Stil. Sticky/absolute am oberen Rand, mit Back-Button und Titel.

## Farbpalette (Glas-Variablen)

```typescript
// Light Mode
glassBackground: 'rgba(255, 255, 255, 0.75)',
glassBorder: 'rgba(255, 255, 255, 0.35)',
glassHighlight: 'rgba(255, 255, 255, 0.5)',

// Dark Mode
glassBackground: 'rgba(30, 45, 35, 0.65)',
glassBorder: 'rgba(120, 200, 120, 0.25)',
glassHighlight: 'rgba(255, 255, 255, 0.15)',
```

## Best Practices

1. **Performance**: Blur-Effekte sind GPU-intensiv. Nur auf iOS vollständig nutzen; Android bekommt Fallback.
2. **Lesbarkeit**: Text auf Glas muss hohen Kontrast haben. Bei Bedarf Schatten oder Hintergrund-Overlay.
3. **Konsistenz**: Alle Glas-Komponenten teilen die gleichen Design-Tokens.
4. **Animation**: Subtile Spring-Animationen für Ein-/Ausblenden verstärken den flüssigen Effekt.

---

*Dieses Design-System wurde für die Hazeless App entwickelt und orientiert sich am Apple iOS 26 „Liquid Glass" Look.*

