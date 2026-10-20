# servispocitacovba.sk — Späť v plnej sile. 💻🔧

Oficiálny webový portál pre **Servis počítačov a notebookov v Bratislave** (`servispocitacovba.sk`). 

Vytvorený v grafitovo-oranžovom redakčnom/švajčiarskom štýle s priestorovým interaktívnym vizuálom rozloženého notebooku (exploded-view), vstavanou interaktívnou diagnostikou problémov a bezpečným PHP mailerom s voliteľnou podporou pre SMTP.

---

## 🚀 Kľúčové vlastnosti a technológie

1. **Kinematický 3D Exploded Laptop Rig (`assets/motion.js` + `assets/style.css`):**
   - Priestorová ilustrácia notebooku rozdelená cez dynamické `clip-path` do 4 samostatných hardvérových vrstiev: displej, klávesnica, základná doska a šasi.
   - Plynulé skladanie / rozkladanie (`--assembly`) synchronizované s posunom stránky.
   - 3D náklon (`perspective(1200px) rotateX(...) rotateY(...)`) reagujúci na pozíciu kurzora.

2. **Interaktívna diagnostika poruchy („Čo sa deje?“):**
   - Okamžitý výber symptómu: *01 Nezapne sa*, *02 Je pomalý*, *03 Prehrieva sa*, *04 Chýbajú mi dáta*.
   - Dynamické vysvetlenie príčiny a priame prepojenie do objednávkového formulára.

3. **Plnohodnotný PHP Mailer & API (`api/contact.php`):**
   - **3 režimy formulára:** `server` (PHP odoslanie), `mailto` (emailový program návštevníka) a `draft` (stiahnutie TXT požiadavky).
   - **Podpora natívneho `mail()` aj overeného `SMTP`:** Pripravená konfigurácia pre Websupport, Wedos, Gmail a iné hostovacie služby.
   - **Bezpečnosť:** Honeypot proti spambotom, striktná validácia dĺžok, sanitizácia hlavičiek, HMAC atomický rate limiter (max 5 pokusov za 15 minút) a zákaz prehliadania konfiguračných súborov cez `.htaccess`.

4. **Čistá architektúra s nulovými závislosťami:**
   - 100% čistý Vanilla JavaScript a moderné CSS. Žiadny npm build, žiadny Node.js runtime, okamžité načítanie.
   - Lokálne vstavaný variabilný font Manrope (nezávislý na externých CDNs).
   - Kompletná stránka ochrany osobných údajov (`ochrana-sukromia.html`).
   - Verejná konfigurácia oddelená v `site-config.js`.

---

## 📁 Štruktúra projektu

```text
├── api/
│   ├── .htaccess             # Ochrana konfiguračných súborov pred verejným stiahnutím
│   ├── config.php            # Súkromná konfigurácia PHP mailera a SMTP údajov
│   └── contact.php           # Zabezpečený endpoint pre odosielanie požiadaviek
├── assets/
│   ├── app.js                # Obsluha diagnostiky, formulára a rozhrania
│   ├── favicon.svg           # Vektorová favicona
│   ├── FONT-LICENSE.txt      # Licencia k písmu Manrope (SIL OFL)
│   ├── laptop-exploded.webp  # High-res grafický asset notebooku
│   ├── manrope-variable.ttf  # Lokálny variabilný font Manrope
│   ├── motion.js             # 3D tilt a kinematika rozloženého notebooku
│   └── style.css             # Kompletný responzívny stylesheet
├── CNAME                     # servispocitacovba.sk
├── index.html                # Hlavná prezentačná stránka
├── NAVOD.md                  # Detailný návod na nasadenie a konfiguráciu hostingu
├── ochrana-sukromia.html     # Zásady spracovania osobných údajov (GDPR)
├── README.md                 # Dokumentácia projektu
├── robots.txt                # Inštrukcie pre vyhľadávače
└── site-config.js            # Verejné nastavenia kontaktov a cien
```

---

## ⚙️ Rýchle nastavenie kontaktov

Všetky verejné údaje sa nastavujú v [`site-config.js`](site-config.js):
```javascript
window.SITE_CONFIG = {
  business: {
    name: 'Servis počítačov BA',
    phone: '+421 9xx xxx xxx',
    email: 'peterkasperek.sk@gmail.com',
    address: 'Bratislava',
    hours: 'Po – Pia: 9:00 – 18:00',
    // ...
  },
  form: {
    mode: 'server', // 'server' | 'mailto' | 'draft'
    endpoint: 'api/contact.php'
  }
};
```

Súkromné nastavenia poštového servera sa nastavujú v [`api/config.php`](api/config.php).
