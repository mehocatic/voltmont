import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, input, signal, viewChildren } from '@angular/core';

const STAGES = {
  bs: [
    { name: 'Pregled krova', title: 'Prvo upoznajemo krov.', text: 'Na fotografijama i na objektu provjeravamo nagib, sjenu i prostor oko dimnjaka. Račun za struju daje nam polazište za dimenzioniranje.', alt: 'Porodična kuća i slobodna krovna ploha prije ugradnje panela.' },
    { name: 'Projektovanje', title: 'Svaki panel dobija svoje mjesto.', text: 'Na nacrtu se vidi kako paneli stanu na jednu krovnu plohu i gdje ostaje prostor za pristup. Ovaj primjer prikazuje deset modula na jednoj strani krova.', alt: 'Shematski tlocrt krova sa dva reda od po pet panela i odvojenim prostorom za dimnjak.' },
    { name: 'Ugradnja', title: 'Od šine do zadnje stezaljke.', text: 'Nosači se pričvršćuju za krovnu konstrukciju, paneli učvršćuju na šine, a instalacija povezuje s pretvaračem. Prije puštanja u rad slijede provjere.', alt: 'Ruke montera pri pričvršćivanju okvira solarnog panela za šinu.' },
    { name: 'Praćenje', title: 'Proizvodnja postaje vidljiva.', text: 'U praćenju sistema možete vidjeti kako se snaga mijenja tokom dana. Pomjerite klizač kroz ovaj primjer i očitajte snagu u odabranom satu.', alt: '' },
  ],
  en: [
    { name: 'Roof survey', title: 'First, we get to know the roof.', text: 'Photos and a site visit help us check pitch, shade and space around chimneys. An electricity bill gives us a starting point for system sizing.', alt: 'A family home with a clear roof surface before panels are installed.' },
    { name: 'Design', title: 'Every panel gets its place.', text: 'A roof plan shows how modules fit on one slope and where access must stay clear. This example places ten modules on one side of the roof.', alt: 'A schematic roof plan with two rows of five panels and a separate chimney.' },
    { name: 'Installation', title: 'From the rails to the last clamp.', text: 'Mounts attach to the roof structure, panels are secured to the rails and the system is connected to the inverter. The installer checks the system before commissioning.', alt: 'An installer’s gloved hands fastening a solar panel frame to the rail.' },
    { name: 'Monitoring', title: 'See what your roof produces.', text: 'System monitoring shows how power changes throughout the day. Move the slider through this example to read the output at each hour.', alt: '' },
  ],
} as const;
const SAMPLE_KW = [0, .18, .75, 1.6, 2.65, 3.3, 3.85, 4.05, 3.56, 2.85, 1.9, 1.15, .51, .12, 0];
const plotX = (hourIndex: number) => 14 + hourIndex * 29;
const plotY = (kw: number) => 128 - kw * 25;

@Component({
  selector: 'app-installation-story', standalone: true,
  imports: [RoofDetailsComponent],
  templateUrl: './installation-story.component.html', styleUrl: './installation-story.component.css',
})
export class InstallationStoryComponent implements AfterViewInit, OnDestroy {
  readonly language = input.required<'bs' | 'en'>();
  readonly bs = computed(() => this.language() === 'bs');
  readonly steps = computed(() => STAGES[this.language()]);
  readonly active = signal(0);
  readonly hourIndex = signal(7);
  readonly ids = ['roof-survey', 'panel-layout', 'panel-installation', 'production-monitor'];
  readonly modules = Array.from({ length: 10 }, (_, index) => ({ x: 113 + index % 5 * 39, y: 112 + Math.floor(index / 5) * 48 }));
  readonly curve = SAMPLE_KW.map((kw, index) => (index ? 'L' : 'M') + plotX(index) + ' ' + plotY(kw)).join(' ');
  readonly reading = computed(() => {
    const i = this.hourIndex();
    return { time: String(i + 5).padStart(2, '0') + ':00', x: plotX(i), y: plotY(SAMPLE_KW[i]),
      kw: new Intl.NumberFormat(this.bs() ? ['bs-BA', 'de-DE'] : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(SAMPLE_KW[i]) };
  });
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('card');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private rangeObserver?: IntersectionObserver;
  private frame = 0;
  private visible = true;

  private readonly schedule = () => {
    if (!this.visible || this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      const cards = this.cards();
      if (!cards.length) return;
      const marker = parseFloat(getComputedStyle(cards[0].nativeElement).scrollMarginTop) + 10;
      let selected = 0;
      for (const [index, card] of cards.entries()) {
        if (card.nativeElement.getBoundingClientRect().top > marker) break;
        selected = index;
      }
      this.active.set(selected);
    });
  };
  ngAfterViewInit(): void {
    if ('IntersectionObserver' in window) {
      this.rangeObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.schedule();
      });
      this.rangeObserver.observe(this.host.nativeElement);
    }
    document.addEventListener('scroll', this.schedule, { passive: true, capture: true });
    window.addEventListener('resize', this.schedule);
    this.schedule();
  }
  ngOnDestroy(): void {
    this.rangeObserver?.disconnect();
    document.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
    window.cancelAnimationFrame(this.frame);
  }
}
import { RoofDetailsComponent } from './roof-details.component';
