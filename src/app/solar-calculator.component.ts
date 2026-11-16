import { Component, computed, input, signal } from '@angular/core';
import { estimateSolar } from './solar-estimate';
import { SystemEnquiryComponent } from './system-enquiry.component';

const COPY = {
  bs: {
    inputs: 'Vaš dom', monthly: 'Prosječna mjesečna potrošnja', area: 'Slobodna površina krova',
    region: 'Područje', inland: 'Veći dio BiH', south: 'Jug Hercegovine',
    production: 'Procijenjena godišnja proizvodnja', system: 'Snaga sistema', footprint: 'Površina panela',
    demand: 'Godišnja potrošnja', result: 'Prijedlog panela', unit: 'po panelu', spec: 'Podaci o modelu',
    near: 'Od dva upoređena modela, ovaj raspored daje proizvodnju najbližu vašoj godišnjoj potrošnji.',
    limited: 'Na ovoj površini ovaj raspored daje najviše energije od dvije upoređene opcije. Za godišnju potrošnju trebalo bi više mjesta.',
    none: 'Premalo mjesta za jedan panel', noneText: 'Manji od dva modela zauzima 1,83 m². Povećajte slobodnu površinu za prvi prijedlog.',
    how: 'Kako računamo procjenu?', method: 'Mjesečnu potrošnju množimo sa 12. Upoređujemo kombinacije cijelih panela od 375 i 470 Wp koje stanu u unesenu površinu. Biramo proizvodnju najbližu godišnjoj potrošnji, a kod istog rezultata manji broj panela.',
    basis: 'Godišnji prinos za odabrano područje iznosi približno',
    limits: 'Unesite prostor koji ostaje nakon odbitka dimnjaka, rubova i prolaza. Oblik, nagib, sjena i orijentacija krova utiču na raspored i stvarnu proizvodnju. Podudaranje godišnjih količina ne govori koliko energije koristite u trenutku proizvodnje.',
    source: 'Regionalna studija o prinosu', photo: 'Ilustrativna AI fotografija panela.',
  },
  en: {
    inputs: 'Your home', monthly: 'Average monthly electricity use', area: 'Usable roof area',
    region: 'Region', inland: 'Most of Bosnia and Herzegovina', south: 'Southern Herzegovina',
    production: 'Estimated annual generation', system: 'System capacity', footprint: 'Panel footprint',
    demand: 'Annual consumption', result: 'Suggested panel', unit: 'per panel', spec: 'Model specifications',
    near: 'Of the two models compared, this layout comes closest to your annual electricity use.',
    limited: 'Of the two options, this layout generates the most energy in the space available. Matching your annual use would take more roof area.',
    none: 'Too little room for one panel', noneText: 'The smaller model takes up 1.83 m². Increase the usable area to see a suggestion.',
    how: 'How is this calculated?', method: 'We multiply monthly use by 12 and compare whole-panel layouts using 375 and 470 Wp modules within the area you enter. We choose the closest annual generation to annual consumption. A tie goes to the smaller panel count.',
    basis: 'Approximate annual yield for the selected region is',
    limits: 'Allow for chimneys, edges and access paths before entering the area. Roof shape, pitch, shade and orientation affect the layout and actual generation. Matching annual totals does not measure how much power you use as it is generated.',
    source: 'Regional solar yield study', photo: 'Illustrative AI photograph of panels.',
  },
} as const;

@Component({
  selector: 'app-solar-calculator',
  standalone: true,
  imports: [SystemEnquiryComponent],
  templateUrl: './solar-calculator.component.html',
  styleUrl: './solar-calculator.component.css',
})
export class SolarCalculatorComponent {
  readonly language = input.required<'bs' | 'en'>();
  readonly copy = computed(() => COPY[this.language()]);
  readonly monthly = signal(450);
  readonly area = signal(35);
  readonly yieldPerKwp = signal(1200);
  readonly result = computed(() => estimateSolar(this.monthly(), this.area(), this.yieldPerKwp()));
  readonly formatter = computed(() => new Intl.NumberFormat(this.language() === 'bs' ? ['bs-BA', 'de-DE'] : 'en-GB', { maximumFractionDigits: 2 }));

  num(value: number, decimals = 0): string {
    const factor = Math.pow(10, decimals);
    return this.formatter().format(Math.round(value * factor) / factor);
  }
}
