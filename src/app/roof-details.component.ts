import { Component, computed, input, signal } from '@angular/core';

const PARTS = [
  { x:80, y:44, bs:['Solarni panel', 'Ćelije ispod stakla pretvaraju sunčevu svjetlost u električnu energiju. Više povezanih panela zajedno napaja pretvarač.'],
    en:['Solar panel', 'The cells beneath the glass turn sunlight into electricity. Several connected panels supply the inverter.'] },
  { x:54, y:67, bs:['Nosač i stezaljka', 'Stezaljka na rubu panela drži okvir uz aluminijsku šinu. Šina prenosi opterećenje na nosače pričvršćene za krov.'],
    en:['Mount and clamp', 'The clamp at the edge holds the panel frame against the aluminium rail. The rail transfers the load to mounts fixed to the roof.'] },
  { x:79, y:82, bs:['Kablovska trasa', 'Kablovi su ispod panela, izvan pogleda. Shema prikazuje kako vode od priključne kutije prema pretvaraču.'],
    en:['Cable route', 'The cables sit out of sight beneath the panels. The diagram shows their path from the junction box towards the inverter.'] },
] as const;

@Component({
  selector:'app-roof-details', standalone:true,
  templateUrl:'./roof-details.component.html', styleUrl:'./roof-details.component.css',
})
export class RoofDetailsComponent {
  readonly language = input.required<'bs'|'en'>();
  readonly alt = input.required<string>();
  readonly parts = PARTS;
  readonly selected = signal(0);
  readonly part = computed(() => this.parts[this.selected()]);
  readonly bs = computed(() => this.language() === 'bs');
}
