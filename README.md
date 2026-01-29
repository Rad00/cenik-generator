# B2B Cenik Generator

Generator naslovnih slik (cover) za B2B cenike ViD Elektro.

## Funkcionalnosti

- 4 template-i: Elektroinštalacije, Odprodaja, Razsvetljava, Topmet
- Live preview z vnosom verzije in datuma veljavnosti
- Prenos PNG v originalni resoluciji (1414×2000 px)
- Validacija dolžine besedila
- Popolnoma statična aplikacija (brez backend-a)

## Uporaba

1. Izberi template iz spustnega menija
2. Vnesi verzijo (npr. `2025_M8`)
3. Vnesi datum veljavnosti (npr. `1. 8. 2025`)
4. Klikni "Prenesi PNG"

## Razvoj

```bash
# Zaženi lokalni server
python -m http.server 8080

# Odpri v brskalniku
http://localhost:8080
```

## Struktura projekta

```
cenik-generator/
├── index.html              # Glavna stran
├── vercel.json             # Vercel konfiguracija
├── config/
│   └── templates.json      # Konfiguracija template-ov
├── css/
│   └── style.css           # Stili z @font-face
├── js/
│   └── generator.js        # Canvas generator
└── assets/
    ├── fonts/              # Lokalni fonti (woff2)
    │   ├── OpenSans-Regular.woff2
    │   ├── OpenSans-Bold.woff2
    │   └── OpenSans-Light.woff2
    └── templates/          # Base PNG slike (1414×2000 px)
        ├── elektro-base.png
        ├── odprodaja-base.png
        ├── razsvetljava-base.png
        └── topmet-base.png
```

## Konfiguracija template-ov

Vsak template v `config/templates.json` ima:

```json
{
  "id": "elektro",
  "name": "Elektroinštalacije",
  "baseImage": "assets/templates/elektro-base.png",
  "width": 1414,
  "height": 2000,
  "version": {
    "prefix": "",
    "x": 143,
    "y": 1235,
    "fontFamily": "CenikFont",
    "fontSize": 76,
    "fontWeight": "700",
    "color": "#1a5a96",
    "maxWidth": 830,
    "minFontSize": 56
  },
  "validFrom": {
    "prefix": "",
    "x": 143,
    "y": 1340,
    "fontFamily": "CenikFont",
    "fontSize": 43,
    "fontWeight": "300",
    "letterSpacing": 4,
    "color": "#333333",
    "maxWidth": 710,
    "minFontSize": 32
  }
}
```

## Prilagoditev koordinat

Za pixel-perfect rezultate prilagodi X, Y koordinate v `config/templates.json` glede na dejanske pozicije v template PNG slikah.

## Deploy na Vercel

```bash
# Namesti Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Ali poveži GitHub repozitorij z Vercel dashboardom za avtomatski deploy.

## Zahteve

### Template slike
- PNG format
- Resolucija: 1414×2000 px
- Brez besedila verzije in datuma (prazno območje)

### Fonti
Trenutno Open Sans. Za drug font:
1. Dodaj `.woff2` datoteke v `assets/fonts/`
2. Posodobi `@font-face` v `css/style.css`

## Licenca

Interno orodje za ViD Elektro.
