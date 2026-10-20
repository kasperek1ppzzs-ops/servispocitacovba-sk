# servispocitacovba.sk — návod k webu

Kompletný web v grafitovo-oranžovom štýle „Späť v plnej sile.“. Vizuál, texty, rozloženie a ovládanie sú súčasťou balíka. Na bežné úpravy ani spustenie statickej stránky nepotrebuješ Node.js, npm ani zostavovanie projektu.

## 1. Otvorenie v počítači

1. Rozbaľ celý ZIP do jedného priečinka.
2. Otvor `index.html` v prehliadači.
3. Ponechaj vedľa neho ostatné súbory a priečinok `assets`. Sú potrebné pre vzhľad, obrázky a ovládanie.

Lokálny náhľad slúži na prehliadanie a prípravu požiadavky. PHP odosielanie sa spustí až na hostingu s PHP. Súbory nikdy neotváraj priamo z komprimovaného ZIP-u.

## 2. Čo je potrebné doplniť

Skutočný telefón, e-mail, prevádzkovateľ, adresa, otváracie hodiny ani ceny neboli pri príprave dodané. Web preto neobsahuje vymyslené kontakty, hodnotenia zákazníkov, počty opráv ani cenníkové sumy.

Hlavné verejné nastavenia sú v **`site-config.js`**. Uprav existujúce hodnoty a zachovaj syntax súboru:

| Pole | Obsah |
| --- | --- |
| `business.name` | Názov zobrazovaný na webe. |
| `business.phone` | Reálny telefón vrátane predvoľby. |
| `business.email` | Reálny kontaktný e-mail. |
| `business.address` | Verejná adresa prevádzky alebo skutočné kontaktné miesto. |
| `business.hours` | Skutočné otváracie hodiny. |
| `business.companyName` | Obchodné meno prevádzkovateľa. |
| `business.companyId` | IČO, ak sa na prevádzkovateľa vzťahuje. |
| `business.companyAddress` | Adresa prevádzkovateľa. |
| `form.mode` | `draft`, `mailto`, `web3forms` alebo `server`; vysvetlené nižšie. |
| `form.accessKey` | Prístupový kľúč Web3Forms pre režim `web3forms`. |
| `form.endpoint` | Pri priloženom PHP odosielaní `api/contact.php`. |

V časti `prices` doplň ceny len vtedy, keď máš skutočný cenník. Hodnota `null` znamená, že pevná suma nie je uvedená a zobrazí sa „Cena po diagnostike“. Ponuku služieb, postup, FAQ a informácie o súkromí prispôsob tomu, čo bude servis reálne poskytovať. Grafika rozloženého notebooku je ilustračný vizuál, nie fotografia skutočnej opravy ani konkrétneho servisovaného modelu.

Do `site-config.js` nevkladaj heslá, prihlasovacie údaje ani SMTP tajomstvá: ide o verejný súbor stiahnuteľný každým návštevníkom.

## 3. Ako funguje formulár

### Režim `draft` — východiskové nastavenie

Formulár pripraví požiadavku a umožní stiahnuť jej text. **Nič sa neodosiela do servisu a nevytvára sa rezervácia.** Tento režim je vhodný na okamžité lokálne prezretie webu, kým nie sú vyplnené skutočné kontakty a pripojené odosielanie.

### Režim `mailto` — cez e-mailový program návštevníka

1. Doplň `business.email`.
2. Zmeň `form.mode` na `mailto`.

Web otvorí predvyplnenú správu v e-mailovom programe návštevníka. Návštevník ju musí odoslať sám. Bez nastaveného e-mailového programu nemusí otvorenie fungovať; stiahnutie požiadavky zostáva záložnou možnosťou. Otvorenie programu nepotvrdzuje doručenie správy.

### Režim `web3forms` — odoslanie bez vlastného servera (vhodné pre GitHub Pages)

GitHub Pages nespúšťa PHP, preto tam režim `server` nefunguje. Režim `web3forms` posiela požiadavky cez bezplatnú službu Web3Forms:

1. Na https://web3forms.com zadaj e-mail, kam majú chodiť požiadavky. Prístupový kľúč (Access Key) ti príde e-mailom.
2. V `site-config.js` vlož kľúč do `form.accessKey` a nechaj `form.mode` na `web3forms`.
3. Odošli testovaciu požiadavku a skontroluj schránku aj priečinok spam.

Kľúč je verejný a nie je to heslo; tvoj e-mail z neho na webe zistiť nejde. Kým je `accessKey` prázdny, formulár sa správa ako režim `draft`. Údaje z formulára spracúva Web3Forms ako ďalší príjemca, uveď to v informáciách o spracovaní osobných údajov.

### Režim `server` — odoslanie cez PHP hosting

Potrebný je hosting s **PHP 8.0 alebo novším**, funkciou `mail()` povolenou a správne nastavenou poskytovateľom hostingu a zapisovateľným systémovým dočasným priečinkom. Statický hosting bez PHP tento spôsob odosielania nespustí.

1. V `api/config.php` vyplň:

   ```php
   'recipient' => 'SKUTOCNA_PRIJIMACIA_SCHRANKA',
   'from_email' => 'SKUTOCNA_ODOSIELACIA_SCHRANKA_DOMENY',
   'site_origin' => 'https://servispocitacovba.sk',
   ```

   Prvé dve ukážkové hodnoty vyššie nahraď platnými, existujúcimi e-mailovými adresami. `from_email` musí byť adresa, ktorú tvoj hosting dovolí používať ako odosielateľa. Adresa návštevníka sa nastaví do `Reply-To`, aby si mu mohol odpovedať.

2. Ak web používa inú hlavnú adresu, nastav `site_origin` presne podľa nej. Adresy s `www` a bez `www` sú rozdielne pôvody. Uprednostni presmerovanie na jednu hlavnú adresu. Ak musia fungovať oba varianty, ďalší uveď v `additional_origins`:

   ```php
   'additional_origins' => ['https://www.servispocitacovba.sk'],
   ```

3. V `site-config.js` zmeň `form.mode` na `server` a ponechaj `form.endpoint` ako `api/contact.php`.
4. Nahraj celý web vrátane priečinka `api` na PHP hosting a over prenos správy do svojej skutočnej schránky.

Kým v `api/config.php` nie sú platné hodnoty, odosielanie je vedome vypnuté a endpoint vracia stav **503 / `not_configured`**. Takéto správanie je správne; žiadna správa sa vtedy neodoslala.

PHP `mail()` potvrdzuje prijatie lokálnym e-mailovým transportom, nie konečné doručenie do schránky. Aj po úspešnom výsledku preto pri prvom nasadení skontroluj reálny prijatý e-mail a priečinok spam.

### Režim SMTP (Websupport, Wedos, Gmail a pod.)

Ak tvoj hosting blokuje funkciu `mail()` alebo vyžaduje overené odosielanie cez SMTP, v `api/config.php` nájdeš sekciu `smtp`:
```php
'smtp' => [
    'enabled' => true,
    'host' => 'smtp.websupport.sk', // napr. pre Websupport
    'port' => 465,                  // 465 (SSL) alebo 587 (TLS)
    'encryption' => 'ssl',          // 'ssl' alebo 'tls'
    'username' => 'info@servispocitacovba.sk',
    'password' => 'tvoje_tajne_heslo',
    'timeout' => 15,
],
```
Pri zapnutom SMTP systém automaticky doručuje správy priamo cez autorizovaný SMTP server bez nutnosti inštalovať ďalšie knižnice.

## 4. Nahratie na hosting

1. Zálohuj prípadný existujúci obsah domény.
2. Nahraj **obsah rozbaleného webového priečinka** do verejného priečinka domény, ktorý určí hosting (napríklad `public_html` alebo `www`). `index.html` má byť priamo v koreňovom priečinku webu.
3. Prenes aj `api/.htaccess`; niektorí FTP klienti takéto súbory štandardne skrývajú.
4. Zapni HTTPS pre svoju doménu.
5. Skontroluj hlavnú stránku, mobilné menu, objednávku a stránku ochrany súkromia.
6. Pri zmenách domény uprav aj príslušné adresy v metadátach a súbore `sitemap.xml`, ak je súčasťou balíka.

Súbor `NAVOD.md` nie je potrebný na chod verejnej stránky a môže zostať len u teba. Súkromné PHP nastavenie nahrávaj iba na hosting, ktorý skutočne vykonáva PHP; pri čisto statickom hostingu priečinok `api` nenahrávaj.

### Ochrana nastavenia servera

Na Apache zakazuje `api/.htaccess` prezeranie adresára aj priamy prístup k `config.php`. Na Nginx sa `.htaccess` nepoužíva; zákaz musí nastaviť správca hostingu. Napríklad pri umiestnení v koreni domény:

```nginx
location = /api/config.php { deny all; }
```

Verejné otvorenie `api/config.php` nesmie zobrazovať zdrojový kód ani nastavenia. Pri riadnom vykonávaní PHP samotný konfiguračný súbor nič nevypisuje; dodatočné blokovanie prístupu je odporúčané.

## 5. Overenie po nasadení

- Otvor web na počítači aj telefóne. Skontroluj čitateľnosť, menu, tlačidlá a zobrazenie obrázkov.
- Otestuj jednotlivé voľby problému a prenos vybranej služby do formulára.
- Vyskúšaj prázdny formulár, chybný e-mail a krátky opis. Odoslanie má byť zablokované.
- V režime `draft` skontroluj obsah stiahnutého súboru a diakritiku.
- V režime `mailto` skontroluj adresáta a text e-mailu; otvorenie okna samo o sebe nič neodosiela.
- V režime `server` odošli jednu vlastnú testovaciu požiadavku až po nastavení svojho prijímacieho e-mailu. Skontroluj skutočné prijatie a funkciu „Odpovedať“.
- Pri serverovej chybe sa nesmie zobraziť úspešné odoslanie; návštevník má dostať možnosť opakovať pokus alebo požiadavku stiahnuť.
- Samotné odoslanie formulára nie je potvrdením termínu ani záväznou objednávkou opravy.

## 6. Čo robí priložený PHP endpoint

- Prijíma len `POST` s obsahom `application/json` a povoleným pôvodom stránky.
- Overuje typy a dĺžky údajov, e-mail, zvolené zariadenie a službu.
- Meno má 2–120 znakov, opis problému 15–3000 znakov, telefón je nepovinný. Nepodporuje prílohy.
- Používa skryté pole na zachytenie jednoduchých automatických odoslaní.
- Obmedzuje počet pokusov na päť za pätnásť minút z jednej IP adresy. Nastavenie je v `api/config.php`.
- Na limit používa súkromný priečinok mimo verejného webu. Ukladá HMAC odvodený od IP adresy, čas a počet pokusov; neukladá tam meno, e-mail ani opis problému. Staré počítadlá priebežne upratuje.
- Nepreberá klientom dodané `X-Forwarded-For`. Ak hosting používa proxy, správne určenie návštevníckej IP má nastaviť jeho správca.
- Posiela len na adresu nastavenú vlastníkom; návštevník nemôže zmeniť prijímateľa. Predmet aj odosielateľ sú riadené serverom.
- Pri zlyhaní sa vráti jasný chybový stav; podrobnosti serverových chýb ani adresy v konfigurácii sa nevypisujú.

## 7. Dôležité k obsahu a súkromiu

Pred verejným spustením doplň skutočného prevádzkovateľa, kontakty a údaje v informáciách o súkromí. Zohľadni reálne používaný hosting, e-mailové schránky a svoj postup uchovávania správ. Šablóna nenahrádza posúdenie konkrétnej prevádzky.

Vizuály boli vytvorené pre tento návrh. Neuvádzaj ich ako dokumentáciu reálne vykonanej opravy. Reálne referencie, fotografie prevádzky a cenník doplň až po získaní príslušných podkladov.

Web je dodaný ako súbory na stiahnutie. Samotné rozbalenie neprepája doménu, nezriaďuje hosting ani e-mailovú schránku a nič automaticky nepublikuje.

## 8. Súbory a použité vizuály

- `index.html` — hlavná stránka.
- `site-config.js` — kontaktné údaje, režim formulára a ceny.
- `assets/style.css`, `assets/app.js`, `assets/motion.js` — vzhľad, ovládanie a pohyb.
- `assets/laptop-exploded.webp` — ilustračný vizuál vytvorený pre návrh stránky.
- `assets/manrope-variable.ttf` — lokálne písmo Manrope. Jeho licencia SIL Open Font License 1.1 je v `assets/FONT-LICENSE.txt`; pri ďalšej distribúcii fontu ponechaj tento licenčný súbor v balíku.
- `api/` — voliteľné odosielanie cez PHP hosting.

Obrázok aj písmo sú pribalené lokálne, takže návštevník ich nemusí načítavať z cudzej obrazovej alebo fontovej služby.
