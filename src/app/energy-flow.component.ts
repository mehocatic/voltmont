import { Component, computed, input, signal } from '@angular/core';

const TEXT = {
  bs: {
    day: 'Dan', night: 'Noć', scenario: 'Odaberite doba dana', storage: 'Baterija u sistemu',
    solar: 'Paneli', inverter: 'Pretvarač', home: 'Dom', battery: 'Baterija', grid: 'Mreža',
    producing: 'Proizvode', idle: 'U pripravnosti', converting: 'Pretvara', powered: 'Prima energiju',
    charging: 'Puni se', discharging: 'Napaja dom', off: 'Isključena', supplying: 'Napaja dom',
    dayTitle: 'Vaš dom pokreće sunce.', dayText: 'Od krova do utičnice. Paneli proizvode energiju koju pretvarač prilagođava vašem domu.',
    dayStorage: 'U ovom primjeru, dnevni višak puni bateriju za kasnije.',
    dayGrid: 'Dom koristi solarnu energiju, a mreža ostaje dostupna kada zatreba.',
    storedTitle: 'Sunce je zašlo. Energija ostaje.', storedText: 'U ovom primjeru napunjena baterija predaje energiju pretvaraču, a on je usmjerava prema domu.',
    storedNote: 'Kada se baterija isprazni, dom se oslanja na mrežu.',
    gridTitle: 'Mreža preuzima noćnu smjenu.', gridText: 'Paneli noću miruju. U sistemu bez baterije, električna mreža pokriva potrošnju doma.',
    gridNote: 'Dodajte bateriju u prikaz da istražite drugi način napajanja.',
    source: 'Dom trenutno napaja', sunSource: 'Sunčeva energija', storedSource: 'Pohranjena energija', gridSource: 'Električna mreža',
    note: 'Ilustrativni scenarij. Rad zavisi od opreme, potrošnje i stanja baterije. Rezervno napajanje zahtijeva posebno projektovan sistem.',
    photo: 'AI ilustracija', altDay: 'Drvena planinska vikendica sa solarnim panelima na dnevnom svjetlu', altNight: 'Ista planinska vikendica noću s toplim osvijetljenim prozorima',
    legend: 'Osvijetljena linija prati aktivni tok energije', diagram: 'Povezani dijelovi sistema i aktivni tok energije',
  },
  en: {
    day: 'Day', night: 'Night', scenario: 'Choose a time of day', storage: 'Battery included',
    solar: 'Panels', inverter: 'Inverter', home: 'Home', battery: 'Battery', grid: 'Grid',
    producing: 'Generating', idle: 'Standby', converting: 'Converting', powered: 'Receiving power',
    charging: 'Charging', discharging: 'Powering home', off: 'Excluded', supplying: 'Powering home',
    dayTitle: 'Your home runs on sunshine.', dayText: 'From the roof to the socket. Panels generate power and the inverter makes it usable at home.',
    dayStorage: 'In this example, daytime surplus charges the battery for later.',
    dayGrid: 'The home uses solar power, with the grid available when needed.',
    storedTitle: 'Sunset arrives. Energy stays.', storedText: 'In this example, a charged battery sends energy through the inverter to your home.',
    storedNote: 'When the battery runs low, the home draws on the grid.',
    gridTitle: 'The grid takes the night shift.', gridText: 'Panels rest at night. In a system without a battery, the electricity grid supplies the home.',
    gridNote: 'Add a battery to the view to explore another source of power.',
    source: 'The home is powered by', sunSource: 'Solar energy', storedSource: 'Stored energy', gridSource: 'The electricity grid',
    note: 'Illustrative scenario. Operation depends on equipment, demand and battery charge. Backup power needs a specifically designed system.',
    photo: 'AI illustration', altDay: 'A timber mountain cabin with solar panels in daylight', altNight: 'The same mountain cabin at night with warmly lit windows',
    legend: 'The illuminated line follows the active energy flow', diagram: 'Connected system components and the active flow of power',
  },
} as const;

@Component({
  selector: 'app-energy-flow', standalone: true,
  templateUrl: './energy-flow.component.html', styleUrl: './energy-flow.component.css',
})
export class EnergyFlowComponent {
  readonly language = input.required<'bs' | 'en'>();
  readonly t = computed(() => TEXT[this.language()]);
  readonly night = signal(false);
  readonly storage = signal(true);
  readonly source = computed(() => !this.night() ? this.t().sunSource : this.storage() ? this.t().storedSource : this.t().gridSource);
  readonly title = computed(() => !this.night() ? this.t().dayTitle : this.storage() ? this.t().storedTitle : this.t().gridTitle);
  readonly description = computed(() => !this.night() ? this.t().dayText : this.storage() ? this.t().storedText : this.t().gridText);
  readonly detail = computed(() => !this.night() ? this.storage() ? this.t().dayStorage : this.t().dayGrid : this.storage() ? this.t().storedNote : this.t().gridNote);
}
