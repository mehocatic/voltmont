# Voltmont

Voltmont je dvojezična web aplikacija za vlasnike kuća koji razmatraju ugradnju solarnih panela. Posjetilac unosi mjesečnu potrošnju struje i slobodnu površinu krova, dobija prijedlog sistema i može pripremiti upit s tim podacima. Bosanski je početni jezik, a engleski je dostupan u navigaciji.

Na prikazu toka energije moguće je promijeniti doba dana i uključiti bateriju kako bi se vidjelo odakle dom dobija struju. Sekcija o ugradnji povezuje pregled krova, raspored panela, montažu i praćenje proizvodnje. Dodir na oznaku uz fotografiju otvara detalj panela, stezaljke ili kablovske trase. Fotografije projekata su ilustrativne.

## Tehnologije i struktura

- **Angular 21 i TypeScript 5.9** pokreću aplikaciju. Svaka veća cjelina ima zasebnu komponentu u `src/app/`. Angular signali povezuju promjene jezika, klizača i odabranih scenarija s prikazom.
- **WebGL 2** iscrtava maglu na naslovnoj sceni. Kada WebGL nije dostupan ili korisnik odabere smanjeno kretanje, jutarnji i noćni prikaz mijenjaju se odmah.
- **HTML, CSS i SVG** oblikuju mobilni meni, raspored panela i dijagram toka energije. Fotografije u sekcijama nalaze se u `public/assets/` u formatu WebP. Naslovna scena učitava slike s vanjskog servisa.
- **Angular CLI i npm** služe za lokalni razvoj i izgradnju statičke verzije. Kalkulator radi u pregledniku.
