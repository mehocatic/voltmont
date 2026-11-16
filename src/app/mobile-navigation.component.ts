import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-mobile-navigation',
  standalone: true,
  templateUrl: './mobile-navigation.component.html',
  styleUrl: './mobile-navigation.component.css',
})
export class MobileNavigationComponent implements OnDestroy {
  readonly language = input.required<'bs' | 'en'>();
  readonly languageChange = output<'bs' | 'en'>();
  readonly open = signal(false);
  readonly bs = computed(() => this.language() === 'bs');
  readonly links = computed(() => this.bs() ? [
    { href: '#how-it-works', label: 'Vaša energija' },
    { href: '#process', label: 'Put do sistema' },
    { href: '#projects', label: 'Zamislite svoj krov' },
    { href: '#about', label: 'Naš pristup' },
    { href: '#faq', label: 'Česta pitanja' },
  ] : [
    { href: '#how-it-works', label: 'Your energy' },
    { href: '#process', label: 'Your path to solar' },
    { href: '#projects', label: 'Imagine your roof' },
    { href: '#about', label: 'Our approach' },
    { href: '#faq', label: 'Common questions' },
  ]);
  @ViewChild('menu', { static: true }) private menu!: ElementRef<HTMLDialogElement>;
  private previousOverflow: string | null = null;

  show(): void {
    if (this.open()) return;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.menu.nativeElement.showModal();
    this.open.set(true);
  }
  close(): void {
    this.menu.nativeElement.close();
    this.restore();
  }
  restore(): void {
    this.open.set(false);
    if (this.previousOverflow !== null) {
      document.body.style.overflow = this.previousOverflow;
      this.previousOverflow = null;
    }
  }
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 820 && this.open()) this.close();
  }
  ngOnDestroy(): void {
    this.restore();
  }
}
