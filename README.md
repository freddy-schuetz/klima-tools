# Klima-Toolbox — n8n-Workflows

8 Klima×KI-Tools nach DMO-Toolbox-Muster (EIN Frontend-Repo `frontends/klima-tools/`,
`klima-*` Webhooks, Data Tables auf launchkit). Plan: `~/.claude/plans/plan-ich-m-chte-evaluieren-shimmering-leaf.md`

## Status — alle 8 Tools LIVE (2026-07-13)

| Welle | Tool | Subdomain | n8n-WFs / Backend |
|-------|------|-----------|-------------------|
| 0 | Status (Token-Polling, gemeinsam) | `/api/status` | `KhZYRuObWKBazi2S` |
| 1 | Pegel-Ampel (Elbe) | pegel-ampel | `Bs8xIkyoZLRxrmzw` Poll + `hdsbSBWQ5XEm0wwF` Widget |
| 1 | Waldbrand-Radar (+FIRMS) | waldbrand-radar | `L3HPNWzrveym1AjC` Poll + `iqk50WwXKx0cYBaV` Widget + `YjtFBgPyWUDr3NK7` Freigabe |
| 2 | Destinations-Klimacheck | klimafit-check | `WQTbS3zslZ9Uv3xV` (async, ERA5+CMIP6+LLM) |
| 2 | Gastgeber-Solar-Check | solar-vorabcheck | `C1N92ETVDk20WXcl` (async, PVGIS) |
| 3 | Grünstrom-Fenster | gruenstrom-ampel | `nsmjcy0ZZRMLBgjN` Status + `pFqr0mP3zxbBM7GB` Abo + `XCLLMn1AKlP1fzfR` Daily + `lGrTKUvi3rxmSl08` Report |
| 3 | Hitze-Briefing | hitze-briefing | **FastAPI** `hitze-backend` auf dograh:8087 (Landsat+Overpass) |
| 4 | Saison-Radar | saison-radar | `aW9CcPoSQp3Mjosh` Poll + `WnaW3y2RF2bjE6OO` Widget + `5v6TcnyKCt1YEsch` Freigabe |
| 4 | Spätfrost-Warndienst | frost-warndienst | `P8TxcdopMg2OggM0` Abo + `dTd1FvHolW1LxzBB` Poll + `kk1D1cb2q32hFo0o` Status |

Alle unter `*.friedemann-schuetz.de`, EIN Repo `frontends/klima-tools/` (freddy-schuetz/klima-tools) via proxy.ts, EIN Vercel-Projekt.

### Neuheits-/Wettbewerbsrecherche (2026-07-13) → Anpassungen
6 Tools per Multi-Agent gegen den Markt geprüft (KLiVO-Katalog + Anbieter). Alle „Lücke mit Twist" (Solar war „besetzt" → Pivot). Umgesetzte Differenzierungen:
- **Klimacheck:** Name „Klimafit" vermieden (WWF-Marke); Hero = Saisonfenster-Verschiebung; CMIP6-Ensemble+Band; LLM-Handlungsfelder nur aus Zahlen; UBA/GERICS als „amtliche Vertiefung" verlinkt.
- **Solar:** Pivot generischer PVGIS-Rechner → **Gastgeber**-Fit (Betriebstyp × Saison-Lastprofil), Fokus Küstenländer ohne Kataster.
- **Grünstrom:** kein Ampel-Klon → **N-Stunden-Prozessfenster** + Team-Mail + CO₂-Report (VSME-Baustein).
- **Hitze:** Fokus **kleine Kommunen <50k**, Einrichtungs-**Ranking als Adressliste** statt Fläche, Screening-Framing.
- **Saison:** Headline = **Kampagnen-Trigger + Klima-Uhr**; kritischer Fix **Effort-Normalisierung** der Meldedichte.
- **Frost:** Stadium **GDD-modelliert** (nicht „DWD lesen"), **Fehlalarm-Reduktion** als Kernnutzen.

### Datenquellen je Tool (alle keyless außer FIRMS free-key)
Pegel: PEGELONLINE · Waldbrand: DWD-WBI + NASA FIRMS · Klimacheck: Open-Meteo ERA5+CMIP6 · Solar: PVGIS v5.3 · Grünstrom: Energy-Charts (via /api/ec-Proxy) · Hitze: Landsat via Planetary Computer + Overpass · Saison: GBIF + iNaturalist + DWD-Phänologie · Frost: Open-Meteo Archiv+Forecast.

## Infrastruktur

- **Data Tables:** `Klima_Checks` viy37GgbVyr0Mtax · `Pegel_Schwellen` MvT32DNs9ckMjX4l (kuratierte Demo-Schwellen, in n8n-UI pflegbar) · `Pegel_Status` 26qNGZdzi8ahp70S · `Waldbrand_Regionen` EwcWmufKcDYmWEan (5 Demo-Regionen mit DWD-Stations-ID) · `Waldbrand_Status` H36jClk3sK5thzvE (neu angelegt 2026-07-13 wegen Hotspot-Spalten — Data-Table-Schema ist per API unveränderlich!)
- **Deploy Frontend:** Repo github.com/freddy-schuetz/klima-tools (public) → Vercel-Projekt `klima-tools` (Team wie dmo-tools), Deploy via `git push origin main`; Env: N8N_BASE, N8N_KLIMA_SECRET, NOMINATIM_EMAIL; 8 Subdomains am Projekt (CNAME → cname.vercel-dns.com), nicht-gelaunchte Tools zeigen via proxy.ts auf die Landing
- **Secret:** in `scripts/build_workflows.py` (SECRET) und `frontends/klima-tools/.env.local` (N8N_KLIMA_SECRET) — Header `x-klima-secret`
- **Deploy:** `python scripts/build_workflows.py [status|pegel_poll|pegel_status]` (REST, idempotent via ids.json)
- **Poll-Test ohne Schedule:** `POST /webhook/klima-pegel-poll-test` mit `x-klima-secret`

## Pegel-Ampel — Architektur

1. `Klima – Pegel-Ampel Poll` (stündlich): PEGELONLINE REST v2 (keyless) → 1 Request alle Elbe-Stationen + 7-Tage-Reihe je kuratierter Station (→ 32-Punkte-Sparkline) → Ampel gegen `Pegel_Schwellen` (`>= gruen_ab_cm` grün, `>= gelb_ab_cm` gelb, sonst rot) → Upsert `Pegel_Status` → bei Statuswechsel Mail
2. `Klima – Pegel-Ampel Status`: GET-Webhook fürs Widget, liefert Abschnitte sortiert nach Elbe-km
3. Frontend `/pegel-ampel`: Ampel-Liste (Kanu/SUP + Fähren) + Sparklines + DisclaimerBox

**Framing (Pflicht):** Orientierung, keine Befahrbarkeits-Garantie; Fähren-Status = Pegel-Heuristik;
Schwellen = Demo-Werte, vor Produktivbetrieb mit Kanuverband/Fährbetrieb/DMO validieren.

## Waldbrand-Radar — Architektur

1. `Klima – Waldbrand Poll` (täglich 06:30, WBI kommt ~04:20): DWD-WBI je Region aus
   `opendata.dwd.de/climate_environment/CDC/derived_germany/fire_danger_index/woodland/forecast/recent/`
   (csv.gz je Station, KEIN Zero-Padding der Stations-ID) → HTTP(file) → Compression(gunzip) → ExtractFromFile(text) → Parse
   (letzte Zeile = aktuellster Termin, `wbi_0..wbi_6` = heute+6 Tage, Stufen 1–5) → Upsert `Waldbrand_Status`
2. **Freigabe-Prozess (Haftungs-Auflage):** Wechsel AUF Stufe ≥4 → Mail mit Einmal-Token-Link →
   `Klima – Waldbrand Freigabe` setzt `banner_aktiv=true` — nie automatisch! Unter Stufe 4 → Auto-Aus durch Poll
3. `Klima – Waldbrand Status`: GET-Webhook fürs Widget (Regionen + 7-Tage-Forecast + Banner-Flag)
4. Frontend `/waldbrand-radar`: Stufen-Badges (DWD-Skala 1–5, immer Zahl+Text, nie Farbe allein) + 7-Tage-Band + DisclaimerBox

**Framing (Pflicht):** WBI = meteorologischer Index, KEINE amtliche Warnung/Sperrung; verbindlich sind
Landesbehörden/Nationalparkverwaltung.

**FIRMS-Hotspot-Layer (seit 2026-07-13):** Code-Node „FIRMS Hotspots" im Poll — 1 Deutschland-Call
(`/api/area/csv/<KEY>/VIIRS_SNPP_NRT|VIIRS_NOAA20_NRT/5.8,47.2,15.1,55.1/2`), Matching ≤30 km je Region,
`hotspots_48h` + Top-5 nach FRP in `hotspots_json`. Fehler nicht fatal (`hotspots_48h=null`).
MAP_KEY liegt als Konstante im Build-Skript (free tier, nur serverseitig; FIRMS erwartet den Key im URL-Pfad,
daher kein n8n-Credential möglich). 0 Hotspots ≠ Unbedenklichkeit (Satellit sieht nur große/heiße Feuer).

## Security-Audit Welle 1 (2026-07-12)

- ✅ Keine Fremd-API-Keys (alles keyless); SMTP via n8n-Credential; Webhook-Secret als Code-Node-Vergleich = etabliertes dmo-tools-Muster
- ✅ Widget-APIs: 403 ohne/mit falschem Secret (getestet); Freigabe: 403 bei falschem Token, 400 bei kaputtem Link (getestet)
- ✅ Alle IF/Filter-Branches verbunden (Validation 0 Fehler, alle 6 WFs, Profile runtime); HTTP mit retryOnFail
- ✅ Keine personenbezogenen Daten (nur öffentliche Umweltdaten; Mails nur an eigene Adresse)
- ⚠️ Bekannt/akzeptiert: Test-Trigger antworten 200 vor Secret-Guard (Guard bricht Ausführung ab, keine Aktion, aber Fehl-Executions möglich); `klima-status` antwortet bei ungültigem Secret mit 200/`not_found` (kein Datenleck, dmo-Muster); kein Error-Workflow konfiguriert (Empfehlung für Produktivbetrieb)

**Testabdeckung (mit Echtdaten statt synthetischer Pins):** Normalfall beide Polls ✓ · Alarm-Pfad Waldbrand real ausgelöst (2 Regionen Stufe 4 → Freigabe-Mail) ✓ · Freigabe pos/neg ✓ · Auth-Negativtests ✓ · 0-Schwellen-Fall wirft sichtbaren Fehler (Guard) ✓ · Leere-Tabelle-Fall (Erstlauf) ✓
