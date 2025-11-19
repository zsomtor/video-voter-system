# Bazu Podcast - YouTube Videó Szavazó Rendszer

Egy webalkalmazás, amely **ELO algoritmussal** becsli meg a YouTube videók teljesítményét a címek és thumbnailek páronkénti összehasonlítása alapján.

## Mi Ez?

Ez az alkalmazás segít tesztelni különböző YouTube videó packagingeket (cím + thumbnail) úgy, hogy a felhasználók szavaznak, melyikre kattintanának. Egy ELO rangsoroló rendszert használva (mint a sakknál) megjósolja, hogy az új packagingek hogyan teljesítenek a meglévő videóidhoz képest.

### Főbb Funkciók

✅ **Páronkénti Szavazás**: A felhasználók egyszerre két videó közül választanak
✅ **ELO Algoritmus**: Kifinomult rangsoroló rendszer, amely a szavazatok alapján frissül
✅ **Teljesítmény Előrejelzés**: Csatorna-specifikus kalibráció a pontos becsléshez
✅ **Benchmark Rendszer**: Összehasonlítás a saját múltbeli és versenytárs videókkal
✅ **Megbízhatósági Pontozás**: Mutatja, mennyire megbízható az előrejelzés
✅ **Gyakorló Mód**: Gyakorolj a saját valós videóidon, lásd a helyes választ
✅ **Admin Dashboard**: Rangsorok megtekintése, videók hozzáadása, részletes elemzés
✅ **Magyar Nyelv**: Teljes magyar nyelvű felület

## Hogyan Működik?

### Az Algoritmus

1. **Kezdő Értékelések**: A videók 1500 ELO-val indulnak (vagy a tényleges nézettség alapján kalibrálva)
2. **Szavazás**: Amikor a felhasználók az A videót választják B helyett:
   - A nyertes pontokat kap
   - A vesztes pontokat veszít
   - A meglepetés győzelmek nagyobb változásokat okoznak
3. **Kalibráció**: A rendszer a SAJÁT csatornád múltbeli teljesítményeiből tanul
4. **Előrejelzés**: Az új packaging értékelése alapján becsüli meg a várható nézettséget

### Kalibráció (A Titok!)

Ez a legfontosabb különbség más rendszerekhez képest:

**Általános Formula**: "1750 ELO = ~80K nézés" (minden csatornára ugyanaz)

**Bazu Kalibráció**: "A TE 10 Bazu epizódod alapján tanulja meg: 1750 ELO = XY nézés a Bazu csatornán"

Példa:
- Silka Ágnes epizód: 149K nézés → 1891 ELO
- Kapitány István epizód: 41K nézés → 1643 ELO
- ÚJ teszt packaging: 1750 ELO
- **Becslés**: ~70-80K nézés (mert ez van a két ismert között)

## Gyors Indítás (Bazu Használatra)

### 1. Telepítés Vercelre

```bash
# 1. GitHub repo létrehozása és push
git remote add origin <your-github-repo>
git push -u origin main

# 2. Vercel.com-ra ugrás
# - New Project
# - Import GitHub repo
# - Auto-detect Next.js

# 3. Database hozzáadása
# - Storage → Create Database → Postgres
# - Environment változók automatikusan beállítódnak
```

### 2. Adatbázis Inicializálás

Deploy után:
1. Látogass el: `https://your-app.vercel.app/api/init`
2. Meg kell látni: `{"success": true}`

### 3. Bazu Epizódok Hozzáadása

Menj: `https://your-app.vercel.app/admin`

#### Első Lépés: Add Hozzá a 10 Valós Bazu Epizódot

Minden epizódnál:
- **Típus**: Saját (Bazu Podcast)
- **Vendég Neve**: Pl. "Kapitány István"
- **Videó Címe**: A YouTube címe
- **Thumbnail Szöveg**: A thumbnail fő szövege (pl. "KRIPTÓ TITKOK")
- **Tényleges Nézettség**: Pl. 41000 (ezt látod a YouTube Studio-ban)
- **Használd kalibrációhoz**: ✅ Bejelölve

**Fontos**: Minél több valós epizódot adsz hozzá ismert nézettséggel, annál pontosabb lesz az algoritmus!

Példa a 10 epizódhoz:
```
1. Silka Ágnes - 149,000 nézés
2. Kapitány István - 41,000 nézés
3. [További 8 vendég a nézettséggel]
```

#### Második Lépés: Teszt Packagingek Hozzáadása

Új packaging variációk teszteléséhez:
- **Típus**: Teszt (új packaging)
- **Videó Címe**: Az új cím amit tesztelni akarsz
- **Thumbnail Szöveg**: Az új thumbnail szöveg
- **Tényleges Nézettség**: Hagyd üresen
- **Használd kalibrációhoz**: ❌ Nem

#### Harmadik Lépés (Opcionális): Versenytárs Videók

Benchmarkoláshoz:
- **Típus**: Versenytárs
- **Csatorna Neve**: Pl. "Konkurens Podcast"
- **Tényleges Nézettség**: Add meg a nézettséget
- **Használd kalibrációhoz**: ❌ Nem (hacsak nem azonos niche-ben van)

### 4. Szavazás Indítása

Küldd szét az URL-t: `https://your-app.vercel.app`

A felhasználók:
1. Két videó közül választanak
2. Kattintanak amelyikre inkább rákkattintanának
3. Azonnal kapnak új párosítást
4. Annyi ideig szavazhatnak amennyit akarnak

**Ajánlott**: Minimum 50 szavazat packagingenként a megbízható eredményhez.

## Oldal Struktúra

### `/` - Főoldal (Szavazás)
Ide jönnek a szavazók. Két videó közül választanak.

**Funkciók**:
- A/B páronkénti összehasonlítás
- Szavazatszámláló
- Linkek a gyakorló módhoz és adminhoz

### `/practice` - Gyakorló Mód
Gyakorolj a valós Bazu epizódokon! Lásd meg, jól tippeltél-e.

**Funkciók**:
- Csak edzési videók (ismert nézettséggel)
- Szavazás után látod a valós számokat
- Nincs mentés az adatbázisba
- Segít fejleszteni az intuíciót

**Tipp**: Csináld ezt először pár percig, mielőtt a teszt videókra szavaznál!

### `/admin` - Admin Dashboard
Itt látod az eredményeket és kezeled a videókat.

**Funkciók**:
1. **Kalibráció Állapot Banner**
   - Mennyire megbízható az algoritmus
   - Hány edzési videód van
   - Nézettség tartomány

2. **Statisztikák**
   - Összes videó
   - Összes szavazat
   - Átlag szavazat/videó
   - Edzési videók száma

3. **Videók Hozzáadása**
   - Űrlap az új videókhoz
   - Automatikus típus váltás
   - Kalibráció opciók

4. **Rangsor Táblázat**
   - Összes videó ELO szerint rendezve
   - Valós vs. becsült nézettség
   - Megbízhatósági mutatók
   - Színkódolt teljesítmény szintek

5. **🧪 Teszt Videók Teljesítménye**
   - Külön kiemelt szekció
   - Összehasonlítás a valós epizódokkal
   - "Jobb mint X, gyengébb mint Y"
   - Becsült nézettség tartomány
   - Vizuális teljesítmény panelek

## Eredmények Értelmezése

### Kalibráció Állapotok

🟢 **Kiváló Kalibráció** (10+ videó, 70%+ megbízhatóság)
- Az előrejelzések nagyon pontosak
- Biztonságosan dönthetik alapján

🔵 **Jó Kalibráció** (5+ videó, 50%+ megbízhatóság)
- Az előrejelzések használhatók
- Több adat = jobb becslések

🟠 **Gyenge Kalibráció** (<5 videó)
- Adj hozzá több edzési videót!
- Legalább 5 kell, 10 az ideális

🔴 **Nincs Kalibráció** (0 videó)
- Add hozzá a valós epizódjaidat először!

### Megbízhatósági Szintek (Packagingenként)

- **0-30 szavazat**: ❌ Nem megbízható - több szavazat kell
- **30-50 szavazat**: 🟡 Közepes - kezd kirajzolódni
- **50-100 szavazat**: 🟢 Jó - megbízható eredmény
- **100+ szavazat**: ✅ Kiváló - nagyon megbízható

### Példa Értelmezés

```
📊 Teszt Videó: "Hogyan építs sikeres podcastot"
Thumbnail: "PODCAST TITKOK"

Rangsor: #3 / 12 videóból
ELO: 1789
Becsült Nézettség: 87,000
Megbízhatóság: 85% (68 szavazat)

⬆️ Jobb mint: Kovács Péter (65K nézés)
⬇️ Gyengébb mint: Silka Ágnes (149K nézés)

Becslés: Ez a packaging valószínűleg 87,000 megtekintést fog kapni
(65,000 és 149,000 között)
```

**Mit jelent ez?**
- Ez a packaging jobban fog teljesíteni, mint a Kovács Péter epizód
- De nem fogja elérni a Silka Ágnes epizód sikerét
- Várható: ~87K nézés
- Megbízhatóság: 85% (jó, további szavazatokkal növelhető)

## API Dokumentáció

### `GET /api/init`
Adatbázis inicializálás. Futtatd egyszer a deploy után.

### `GET /api/pair`
Két véletlenszerű videó lekérése szavazáshoz.

### `GET /api/practice-pair`
Két edzési videó lekérése gyakorló módhoz.

### `POST /api/vote`
Szavazat rögzítése és ELO frissítés.

**Body**:
```json
{
  "winnerId": 1,
  "loserId": 2
}
```

### `GET /api/rankings`
Összes videó rangsorolva + kalibráció.

**Válasz**:
```json
{
  "totalVotes": 450,
  "totalVideos": 12,
  "rankings": [...],
  "calibration": {
    "isCalibrated": true,
    "channelName": "Bazu Podcast",
    "trainingDataCount": 10,
    "minViews": 6000,
    "maxViews": 156000,
    "confidence": 0.85,
    "status": "excellent",
    "message": "Kiváló kalibráció..."
  }
}
```

### `POST /api/videos`
Új videó hozzáadása.

**Body**:
```json
{
  "title": "Epizód cím",
  "thumbnailText": "THUMBNAIL SZÖVEG",
  "sourceType": "own",
  "actualViews": 85000,
  "channelName": "Bazu Podcast",
  "guestName": "Kapitány István",
  "isTrainingSet": true
}
```

### `GET /api/benchmark/:id`
Benchmark összehasonlítás egy adott videóhoz.

## Projekt Struktúra

```
video-voter-system/
├── app/
│   ├── page.tsx                   # Főoldal - szavazás
│   ├── practice/
│   │   └── page.tsx              # Gyakorló mód
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard
│   ├── api/
│   │   ├── init/route.ts         # DB inicializálás
│   │   ├── pair/route.ts         # Véletlenszerű párosítás
│   │   ├── practice-pair/route.ts # Edzési párosítás
│   │   ├── vote/route.ts         # Szavazat rögzítés
│   │   ├── rankings/route.ts     # Rangsorok + kalibráció
│   │   ├── videos/route.ts       # Videó hozzáadás
│   │   └── benchmark/[id]/route.ts # Benchmark lekérdezés
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Globális stílusok
├── lib/
│   ├── db.ts                     # Adatbázis műveletek
│   ├── elo.ts                    # ELO algoritmus
│   └── calibration.ts            # Csatorna-specifikus kalibráció
├── package.json
├── tsconfig.json
└── README.md
```

## Adatbázis Séma

### `videos` tábla

| Mező | Típus | Leírás |
|------|-------|--------|
| `id` | serial | Elsődleges kulcs |
| `title` | text | Videó címe |
| `thumbnail_text` | text | Thumbnail fő szövege |
| `actual_views` | integer | Tényleges nézettség (nullable) |
| `elo_rating` | integer | ELO értékelés (default: 1500) |
| `vote_count` | integer | Szavazatok száma |
| `source_type` | text | 'own', 'competitor', vagy 'test' |
| `channel_name` | text | Csatorna neve (nullable) |
| `guest_name` | text | Vendég neve (nullable) |
| `is_training_set` | boolean | Használd kalibrációhoz? |
| `created_at` | timestamp | Létrehozás dátuma |

### `votes` tábla

| Mező | Típus | Leírás |
|------|-------|--------|
| `id` | serial | Elsődleges kulcs |
| `winner_id` | integer | Nyertes videó ID |
| `loser_id` | integer | Vesztes videó ID |
| `created_at` | timestamp | Szavazás dátuma |

## Technológiai Stack

- **Framework**: Next.js 14 (React)
- **Nyelv**: TypeScript
- **Styling**: Tailwind CSS
- **Adatbázis**: Vercel Postgres (PostgreSQL)
- **Deployment**: Vercel
- **Algoritmus**: ELO Rating System + Linear Regression Calibration

## Tippek a Legjobb Eredményekhez

### 1. Építs Erős Edzési Adathalmazt
- ✅ Add hozzá **mind a 10 Bazu epizódot** ismert nézettséggel
- ✅ Használj széles nézettség tartományt (pl. 6K - 156K)
- ✅ Jelöld be mindet "edzési" videóként

### 2. Gyűjts Elég Szavazatot
- 🎯 **Minimum**: 50 szavazat teszt packagingenként
- 🎯 **Ideális**: 100+ szavazat
- 💡 Küldd szét a linket a közösségednek!

### 3. Tesztelj Változatokat
- Hozz létre 3-5 különböző packaging variációt
- Teszteld a címeket külön-külön
- Teszteld a thumbnail szövegeket külön-külön
- Kombináld a legjobb elemeket

### 4. Értelmezd Óvatosan
- ⚠️ <30 szavazat = csak irány, nem végleges
- ✅ 50+ szavazat = megbízható előrejelzés
- 🎯 100+ szavazat = nagyon pontos

### 5. Használd a Gyakorló Módot
- Először gyakorolj a valós epizódokon
- Fejleszd az intuíciódat
- Később pontosabban fogsz szavazni

## Hibaelhárítás

### "Nincs elég videó az adatbázisban"
**Megoldás**: Adj hozzá legalább 2 videót az `/admin` oldalon.

### "Nincs kalibráció"
**Megoldás**: Adj hozzá legalább 5 saját videót ismert nézettséggel és jelöld be őket edzési videóként.

### "Gyenge kalibráció"
**Megoldás**: Adj hozzá még több edzési videót. Ideális: 10+

### Adatbázis kapcsolati hiba
**Ellenőrizd**:
1. Vercel Postgres helyesen van-e linkelve
2. Environment változók be vannak-e állítva
3. `/api/init` végpont meghívva lett-e

## Jövőbeli Fejlesztési Lehetőségek

- 🖼️ Valódi thumbnail képek feltöltése
- 📊 Történeti teljesítmény tracking
- 📈 Grafikonok az ELO változásokról
- 🔒 Bejelentkezés az admin panelhez
- 📧 Email értesítések az eredményekről
- 📱 Mobil app verzió
- 🤖 AI-generált thumbnail javaslatok

## Támogatás

Kérdés vagy probléma esetén nyiss egy GitHub issue-t!

## Licenc

MIT License - használd szabadon a saját projektjeidhez!

---

**Készítve a Bazu Podcast csapatának 🎙️**

Használd bátran, hogy megtaláld a tökéletes packaging-et minden epizódhoz!
