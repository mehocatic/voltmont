import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { EnergyFlowComponent } from './energy-flow.component';
import { SolarCalculatorComponent } from './solar-calculator.component';
import { GUIDE_COPY } from './section-copy';
import { CONTACT_EMAIL } from './contact';

@Component({
  selector: 'app-site-sections',
  standalone: true,
  imports: [SolarCalculatorComponent, EnergyFlowComponent],
  templateUrl: './site-sections.component.html',
  styleUrl: './site-sections.component.css',
})
export class SiteSectionsComponent implements AfterViewInit, OnDestroy {
  readonly language = input<'bs' | 'en'>('bs');
  readonly guide = computed(() => GUIDE_COPY[this.language()]);
  readonly t = computed(() => this.text[this.language()]);
  readonly comparison = signal(50);
  readonly showFlow = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private revealObserver: IntersectionObserver | null = null;
  private readonly text = {
    bs: {
      flowTitle: 'Pogledajte kako\nvaš sistem radi.', flowIntro: 'Izaberite dan ili noć i uključite bateriju. Osvijetljene linije pokazuju put energije do vašeg doma.',
      energyTag: 'ENERGIJA KOJA POVEZUJE', energyTitle: 'Koliko energije može\ndati vaš krov?', energyIntro: 'Unesite potrošnju i slobodnu površinu krova. Odmah ćete vidjeti očekivanu proizvodnju, broj panela i model koji odgovara vašem primjeru.',
      processTag: 'PUT DO VAŠEG SISTEMA', processTitle: 'Od prvog pregleda\ndo prve proizvodnje.', processIntro: 'Pratite jedan sistem kroz četiri koraka. Odaberite korak ili nastavite skrolati.', stage: 'KORAK', photoAlt: 'Savremena porodična kuća sa solarnim panelima na kosom krovu',
      projectsTag: 'ZAMISLITE SVOJ KROV', projectsTitle: 'Isti dom.\nNova mogućnost.', projectsIntro: 'Povucite liniju i pogledajte kako se paneli mogu uklopiti u arhitekturu kuće.', before: 'Prije', after: 'Poslije', compareLabel: 'Poređenje krova prije i poslije postavljanja solarnih panela', compareHint: 'Pomjerite klizač za poređenje', illustrative: 'Ilustrativni primjer · AI fotografije, nisu izvedeni projekti firme Voltmont.', projectName: 'Porodični dom, druga perspektiva', projectNote: 'Koncept integracije panela na kosi krov. Stvarni raspored zavisi od stručne procjene objekta.',
      aboutTag: 'PRISTUP KOJI IMA SMISLA', aboutTitle: 'Tehnologija na krovu.\nPažnja u svakom detalju.', aboutIntro: 'Solarni sistem treba se uklopiti u vaš dom, njegovu arhitekturu i vašu svakodnevicu. Počinjemo od tih potreba.', installationAlt: 'Detalj ruku montera pri pričvršćivanju solarnog panela na montažnu šinu', photoNote: 'Ilustrativna AI fotografija ugradnje.',
      faqTag: 'DOBRA PITANJA, JASNI ODGOVORI', faqTitle: 'Prije prvog koraka.',
      contactTag: 'RAZGOVARAJMO O VAŠEM KROVU', contactTitle: 'Vaš dom.\nVaš sljedeći korak.', contactText: 'Za početak su dovoljni lokacija, nekoliko fotografija krova i okvirna potrošnja energije. Zajedno možemo razmotriti mogućnosti.', email: 'Napišite nam', demo: 'Demo kontakt adresa - zamijeniti službenom adresom prije prijema upita.', emailSubject: 'Upit za solarni sistem', emailBody: 'Pozdrav ekipi Voltmonta,\n\nLokacija objekta:\nMjesečna potrošnja:\nOpis krova:\nMoje pitanje:\n', top: 'Nazad na vrh', region: 'Bosna i Hercegovina · Balkan', rights: 'Pametnija energija za vaš dom.', processLink: 'Kako do sistema', contactLink: 'Kontakt',
    },
    en: {
      flowTitle: 'See how your\nsystem works.', flowIntro: 'Choose day or night and include a battery. The illuminated lines show how power reaches your home.',
      energyTag: 'ENERGY, CONNECTED', energyTitle: 'How much energy can\nyour roof generate?', energyIntro: 'Set your electricity use and usable roof area to see estimated generation, panel count and a model that fits your example.',
      processTag: 'THE PATH TO YOUR SYSTEM', processTitle: 'From the first survey\nto the first kilowatt-hour.', processIntro: 'Follow one system through four stages. Pick a stage or scroll to follow the installation.', stage: 'STEP', photoAlt: 'Contemporary family house with photovoltaic panels on a pitched roof',
      projectsTag: 'IMAGINE YOUR ROOF', projectsTitle: 'The same home.\nA new possibility.', projectsIntro: 'Move the divider to see how solar panels can become part of the architecture.', before: 'Before', after: 'After', compareLabel: 'Compare the roof before and after adding solar panels', compareHint: 'Move the slider to compare', illustrative: 'Illustrative concept · AI photographs, not completed Voltmont projects.', projectName: 'A family home, a fresh perspective', projectNote: 'A concept for integrating panels on a pitched roof. The actual layout requires a professional roof assessment.',
      aboutTag: 'A CONSIDERED APPROACH', aboutTitle: 'Technology on the roof.\nCare in every detail.', aboutIntro: 'A solar system should fit your home, its architecture and everyday life. Those needs are the starting point.', installationAlt: 'Detail of an installer fastening a photovoltaic panel to a mounting rail', photoNote: 'Illustrative AI installation photograph.',
      faqTag: 'GOOD QUESTIONS, CLEAR ANSWERS', faqTitle: 'Before your first step.',
      contactTag: 'LET’S TALK ABOUT YOUR ROOF', contactTitle: 'Your home.\nYour next step.', contactText: 'Start with a location, a few roof photos and an indication of your energy use. Together, we can explore the possibilities.', email: 'Write to us', demo: 'Demo contact address - replace with the official address before receiving enquiries.', emailSubject: 'Solar system enquiry', emailBody: 'Hello Voltmont,\n\nProperty location:\nMonthly electricity use:\nRoof description:\nMy question:\n', top: 'Back to top', region: 'Bosnia and Herzegovina · The Balkans', rights: 'Smarter energy for your home.', processLink: 'Your path to solar', contactLink: 'Contact',
    },
  };
  readonly emailAddress = CONTACT_EMAIL;
  readonly mailto = computed(() => 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(this.t().emailSubject) + '&body=' + encodeURIComponent(this.t().emailBody));

  updateComparison(event: Event): void {
    this.comparison.set(Number((event.target as HTMLInputElement).value));
  }

  ngAfterViewInit(): void {
    const elements = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) return;
    this.revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        this.revealObserver?.unobserve(entry.target);
      }
    }, { threshold: .08 });
    elements.forEach(element => { element.classList.add('will-reveal'); this.revealObserver!.observe(element); });

  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }
}
