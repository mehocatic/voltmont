import { Component, computed, input, signal } from '@angular/core';
import { CONTACT_EMAIL } from './contact';

const TEXT = {
  bs: {
    action: 'Pošalji upit za ovaj sistem', estimate: 'Vaša procjena', monthly: 'Mjesečna potrošnja', area: 'Slobodna površina krova',
    region: 'Područje', panels: 'Predloženi paneli', capacity: 'Snaga sistema', production: 'Procijenjena godišnja proizvodnja',
    location: 'Mjesto ugradnje', contact: 'Vaš e-mail', prepare: 'Pripremi poruku', subject: 'Upit za solarni sistem',
    hello: 'Pozdrav, zanima me solarni sistem prema sljedećoj procjeni.', draft: 'Tekst upita', open: 'Otvori u e-mail aplikaciji',
    demo: 'Kontakt je trenutno demonstracijski. Tekst možete kopirati ili otvoriti nacrt i sami dodati primaoca.',
  },
  en: {
    action: 'Enquire about this system', estimate: 'Your estimate', monthly: 'Monthly electricity use', area: 'Usable roof area',
    region: 'Region', panels: 'Suggested panels', capacity: 'System capacity', production: 'Estimated annual generation',
    location: 'Installation town or city', contact: 'Your email', prepare: 'Prepare message', subject: 'Solar system enquiry',
    hello: 'Hello, I am interested in a solar system based on this estimate.', draft: 'Enquiry text', open: 'Open in email app',
    demo: 'The contact address is currently a demo. Copy the text or open a draft and add a recipient yourself.',
  },
} as const;

@Component({
  selector: 'app-system-enquiry', standalone: true,
  templateUrl: './system-enquiry.component.html', styleUrl: './system-enquiry.component.css',
})
export class SystemEnquiryComponent {
  readonly language = input.required<'bs' | 'en'>();
  readonly monthly = input.required<string>();
  readonly area = input.required<string>();
  readonly region = input.required<string>();
  readonly panels = input.required<string>();
  readonly capacity = input.required<string>();
  readonly production = input.required<string>();
  readonly town = signal('');
  readonly email = signal('');
  readonly prepared = signal(false);
  readonly demo = CONTACT_EMAIL.endsWith('.example');
  readonly t = computed(() => TEXT[this.language()]);
  readonly specs = computed(() => [
    [this.t().monthly, this.monthly() + ' kWh'], [this.t().area, this.area() + ' m²'],
    [this.t().region, this.region()], [this.t().panels, this.panels()],
    [this.t().capacity, this.capacity() + ' kWp'], [this.t().production, this.production() + ' kWh'],
  ]);
  readonly body = computed(() => [
    this.t().hello, '', ...this.specs().map(([label, value]) => label + ': ' + value),
    '', this.t().location + ': ' + this.town().trim(), this.t().contact + ': ' + this.email().trim(),
  ].join('\n'));
  readonly mailto = computed(() => 'mailto:' + (this.demo ? '' : CONTACT_EMAIL) + '?subject='
    + encodeURIComponent(this.t().subject) + '&body=' + encodeURIComponent(this.body()));

  prepare(event: SubmitEvent, preview: HTMLTextAreaElement): void {
    event.preventDefault();
    this.prepared.set(true);
    requestAnimationFrame(() => preview.focus());
  }
}
