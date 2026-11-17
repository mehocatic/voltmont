# Voltmont

Voltmont je dvojezična web aplikacija za vlasnike kuća koji razmatraju ugradnju solarnih panela. Posjetilac unosi mjesečnu potrošnju struje i slobodnu površinu krova, dobija prijedlog sistema i može pripremiti upit s tim podacima. Bosanski je početni jezik, a engleski je dostupan u navigaciji.

Na prikazu toka energije moguće je promijeniti doba dana i uključiti bateriju kako bi se vidjelo odakle dom dobija struju. Sekcija o ugradnji povezuje pregled krova, raspored panela, montažu i praćenje proizvodnje. Dodir na oznaku uz fotografiju otvara detalj panela, stezaljke ili kablovske trase. Fotografije projekata su ilustrativne.

## Tehnologije i struktura

- **Angular 21 i TypeScript 5.9** pokreću aplikaciju. Svaka veća cjelina ima zasebnu komponentu u `src/app/`. Angular signali povezuju promjene jezika, klizača i odabranih scenarija s prikazom.
- **WebGL 2** iscrtava maglu na naslovnoj sceni. Kada WebGL nije dostupan ili korisnik odabere smanjeno kretanje, jutarnji i noćni prikaz mijenjaju se odmah.
- **HTML, CSS i SVG** oblikuju mobilni meni, raspored panela i dijagram toka energije. Fotografije u sekcijama nalaze se u `public/assets/` u formatu WebP. Naslovna scena učitava slike s vanjskog servisa.
- **Angular CLI i npm** služe za lokalni razvoj i izgradnju statičke verzije. Kalkulator radi u pregledniku.

## Lokalno pokretanje

Potreban je Node.js 22.12 ili noviji iz serije 22, ili Node.js 24, uz npm. Iz korijenskog direktorija projekta pokrenite:

```sh
npm ci
npm start
```

Otvorite [lokalnu aplikaciju](http://127.0.0.1:4200). Za produkcijsku verziju pokrenite `npm run build` i na statički hosting prenesite sadržaj direktorija `dist/`.

## Kako kalkulator bira panele

Logika u `src/app/solar-estimate.ts` poredi modele REC TwinPeak 4 od 375 Wp i REC Alpha Pure-RX od 470 Wp. Godišnju potrošnju dobija množenjem mjesečne potrošnje sa 12. Za svaki model računa koliko cijelih panela stane na raspoloživu površinu, a zatim bira raspored čija je procijenjena godišnja proizvodnja najbliža potrošnji.

Na primjer, za 450 kWh mjesečno, 35 m² slobodnog krova i prinos od 1.200 kWh po kWp godišnje, kalkulator predlaže 12 panela od 375 Wp. Ukupna snaga je 4,5 kWp, a procijenjena proizvodnja 5.400 kWh godišnje. Nagib, sjena i orijentacija krova utiču na stvarni rezultat.

## Kontakt

Probna adresa je `kontakt@voltmont.example`. Obrazac prikazuje tekst upita i može ga otvoriti kao nacrt u aplikaciji za e-mail. Za prijem upita na službenu adresu postavite vrijednost `CONTACT_EMAIL` u `src/app/contact.ts` i ažurirajte napomenu o demo kontaktu u obje jezičke verzije.
