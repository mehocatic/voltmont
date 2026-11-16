import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';

type Scene = 0 | 1;
type Uniform = 'R' | 'T' | 'S' | 'K';

const SINK = 240;
const RISE = 820;
const DEPTH = .27;
const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, value: number): number => {
  const x = clamp((value - a) / (b - a));
  return x * x * (3 - 2 * x);
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  preserveWhitespaces: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  readonly language = signal<'bs' | 'en'>('bs');
  readonly copy = computed(() => this.translations[this.language()]);
  private readonly translations = {
    bs: {
      how: 'Kako funkcioniše', projects: 'Naši projekti', about: 'O nama', careers: 'Karijere', resources: 'Resursi', customers: 'Korisnici', contact: 'Kontakt',
      headline: 'Vaš krov.', continuation: 'Vaša energija.', morning: 'Jutro', night: 'Noć', morningCaption: 'Energija s krova', nightCaption: 'Svjetlo u domu', time: 'Doba dana',
      caption: 'Solarna energija prilagođena vašem krovu, potrošnji i načinu života.',
      morningAlt: 'Kuća sa solarnim panelima u blagom jutarnjem svjetlu', nightAlt: 'Ista kuća u sumrak s toplim osvijetljenim prozorima',
      title: 'Voltmont - Pametna solarna energija', description: 'Pametnija solarna energija za vaš dom. Voltmont donosi održiva energetska rješenja u Bosnu i Hercegovinu i širi Balkan.'
    },
    en: {
      how: 'How It Works', projects: 'Our Projects', about: 'About Us', careers: 'Careers', resources: 'Resources', customers: 'Customers', contact: 'Contact',
      headline: 'Your roof.', continuation: 'Your energy.', morning: 'Morning', night: 'Night', morningCaption: 'Energy from your roof', nightCaption: 'Light in your home', time: 'Time of day',
      caption: 'Solar power shaped around your roof, energy use and way of life.',
      morningAlt: 'A charcoal farmhouse with solar panels in soft morning light', nightAlt: 'The same farmhouse at dusk with warm amber windows',
      title: 'Voltmont - Smart Solar Energy', description: 'Discover smarter solar energy for your home. Voltmont brings sustainable energy solutions to Bosnia and Herzegovina and the wider Balkans.'
    }
  };

  setLanguage(language: 'bs' | 'en'): void {
    this.language.set(language);
    document.documentElement.lang = language;
    document.title = this.copy().title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', this.copy().description);
  }
  @ViewChild('hero', { static: true }) private hero!: ElementRef<HTMLElement>;
  @ViewChild('fog', { static: true }) private fog!: ElementRef<HTMLCanvasElement>;
  @ViewChild('setM', { static: true }) private setM!: ElementRef<HTMLDivElement>;
  @ViewChild('setN', { static: true }) private setN!: ElementRef<HTMLDivElement>;
  @ViewChild('morningButton', { static: true }) private morningButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('nightButton', { static: true }) private nightButton!: ElementRef<HTMLButtonElement>;

  private readonly zone = inject(NgZone);
  private readonly root = document.documentElement.style;
  private readonly motion = window.matchMedia('(prefers-reduced-motion:reduce)');
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private shaders: WebGLShader[] = [];
  private uniforms: Record<Uniform, WebGLUniformLocation | null> = { R: null, T: null, S: null, K: null };
  private target: Scene = 1;
  private requested: Scene = 1;
  private queued: Scene | null = null;
  private from = 1;
  private start = -1e9;
  private swapped = true;
  private k = 1;
  private animating = false;
  private clock = performance.now();
  private frameId: number | null = null;
  private heroInView = true;
  private heroObserver: IntersectionObserver | null = null;
  private viewportHeight = window.innerHeight;
  private destroyed = false;
  private requestId = 0;
  private ready: [boolean, boolean] = [false, false];
  private readiness: [Promise<boolean>, Promise<boolean>] = [Promise.resolve(false), Promise.resolve(false)];
  private readonly listenerCleanups: Array<() => void> = [];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.prepareImages();
      this.initializeFog();
      this.resize();
      window.addEventListener('resize', this.resize);
      this.motion.addEventListener('change', this.motionChanged);
      this.fog.nativeElement.addEventListener('webglcontextlost', this.contextLost);
      this.fog.nativeElement.addEventListener('webglcontextrestored', this.contextRestored);
      this.render(performance.now());
      if (this.gl) this.frameId = requestAnimationFrame(this.loop);
      if ('IntersectionObserver' in window) {
        this.heroObserver = new IntersectionObserver(entries => {
          this.heroInView = entries[0]?.isIntersecting ?? true;
          if (!this.heroInView && this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
          } else if (this.heroInView && this.gl && this.frameId === null && !this.destroyed) {
            this.frameId = requestAnimationFrame(this.loop);
          }
        });
        this.heroObserver.observe(this.hero.nativeElement);
      }
    });
  }

  pick(scene: Scene): void {
    this.zone.runOutsideAngular(() => {
      this.requested = scene;
      this.morningButton.nativeElement.setAttribute('aria-pressed', String(!scene));
      this.nightButton.nativeElement.setAttribute('aria-pressed', String(!!scene));
      const selection = ++this.requestId;
      if (this.ready[scene]) {
        this.select(scene);
      } else {
        void this.readiness[scene].then((ready) => {
          if (ready && !this.destroyed && selection === this.requestId) this.select(scene);
        });
      }
    });
  }

  private select(scene: Scene): void {
    if (this.motion.matches || !this.gl) {
      this.instant(scene);
      return;
    }
    if (scene === this.target && this.queued === null) return;
    if (this.animating) this.queued = scene;
    else this.begin(scene, this.clock);
  }

  private begin(scene: Scene, now: number): void {
    this.target = scene;
    this.from = this.k;
    this.start = now;
    this.swapped = false;
    this.animating = true;
  }

  private show(scene: Scene): void {
    this.setM.nativeElement.classList.toggle('is-on', !scene);
    this.setN.nativeElement.classList.toggle('is-on', !!scene);
  }

  private instant(scene: Scene): void {
    this.target = scene;
    this.queued = null;
    this.animating = false;
    this.k = scene;
    this.show(scene);
    this.update(0, 0, 0, scene, performance.now());
  }

  private prepareImages(): void {
    const images = Array.from(this.hero.nativeElement.querySelectorAll<HTMLImageElement>('img'));
    const promises = new Map<HTMLImageElement, Promise<boolean>>();
    for (const image of images) {
      const loaded = image.complete
        ? Promise.resolve(image.naturalWidth > 0)
        : new Promise<boolean>((resolve) => {
          const finish = (success: boolean): void => {
            image.removeEventListener('load', onLoad);
            image.removeEventListener('error', onError);
            resolve(success);
          };
          const onLoad = (): void => finish(true);
          const onError = (): void => finish(false);
          image.addEventListener('load', onLoad, { once: true });
          image.addEventListener('error', onError, { once: true });
          this.listenerCleanups.push(() => finish(false));
        });
      promises.set(image, loaded.then(async (success) => {
        if (!success) {
          console.warn('An original Voltmont image could not load:', image.src);
          return false;
        }
        try { await image.decode(); } catch { /* The loaded image is still usable when decode is unsupported. */ }
        return true;
      }));
    }
    for (const scene of [0, 1] as const) {
      const set = scene ? this.setN.nativeElement : this.setM.nativeElement;
      const sky = this.hero.nativeElement.querySelector<HTMLImageElement>(scene ? '#skyN' : '#skyM');
      const sceneImages = [...set.querySelectorAll<HTMLImageElement>('img'), ...(sky ? [sky] : [])];
      this.readiness[scene] = Promise.all(sceneImages.map((image) => promises.get(image)!))
        .then((results) => this.ready[scene] = results.every(Boolean));
    }
  }

  private initializeFog(): void {
    const gl = this.fog.nativeElement.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) return;
    this.gl = gl;
    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      this.shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    this.program = gl.createProgram();
    if (!vertex || !fragment || !this.program) {
      this.releaseFog();
      return;
    }
    gl.attachShader(this.program, vertex);
    gl.attachShader(this.program, fragment);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      this.releaseFog();
      return;
    }
    gl.useProgram(this.program);
    for (const uniform of ['R', 'T', 'S', 'K'] as const) {
      this.uniforms[uniform] = gl.getUniformLocation(this.program, uniform);
    }
  }

  private readonly resize = (): void => {
    this.viewportHeight = window.innerHeight;
    if (!this.gl) return;
    const canvas = this.fog.nativeElement;
    const width = Math.round(Math.min(window.innerWidth, 960));
    const height = Math.round(width * this.viewportHeight / window.innerWidth);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  };

  private readonly motionChanged = (): void => {
    if (this.motion.matches && this.ready[this.requested]) this.instant(this.requested);
  };

  private readonly contextLost = (event: Event): void => {
    event.preventDefault();
    this.releaseFog();
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.instant(this.ready[this.requested] ? this.requested : this.target);
  };

  private readonly contextRestored = (): void => {
    if (this.destroyed) return;
    this.initializeFog();
    this.resize();
    if (this.gl && this.heroInView && this.frameId === null) this.frameId = requestAnimationFrame(this.loop);
  };

  private readonly loop = (now: number): void => {
    if (this.destroyed) return;
    this.render(now);
    this.frameId = requestAnimationFrame(this.loop);
  };

  private render(now: number): void {
    this.clock = now;
    const d = now - this.start;
    let y = 0, surge = 0, dip = 0, k2 = this.k;
    if (this.animating) {
      if (d < SINK) {
        const x = d / SINK;
        y = x * x * (3 - 2 * x) * DEPTH;
      } else {
        if (!this.swapped) {
          this.swapped = true;
          this.show(this.target);
        }
        const x = clamp((d - SINK) / RISE);
        y = Math.pow(1 - x, 3.4) * DEPTH;
      }
      surge = smooth(0, SINK * .92, d) * (1 - smooth(SINK + 70, SINK + RISE * .92, d));
      dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
      this.k = this.from + (this.target - this.from) * smooth(120, 520, d);
      k2 = this.from + (this.target - this.from) * smooth(340, 760, d);
      if (d >= SINK + RISE) {
        this.animating = false;
        this.k = k2 = this.target;
        y = surge = dip = 0;
        if (this.queued !== null && this.queued !== this.target) {
          const next = this.queued;
          this.queued = null;
          this.begin(next, now);
        } else this.queued = null;
      }
    }
    this.update(y, surge, dip, k2, now);
  }

  private update(y: number, surge: number, dip: number, k2: number, now: number): void {
    this.root.setProperty('--sink', (y * this.viewportHeight).toFixed(1) + 'px');
    this.root.setProperty('--k', this.k.toFixed(3));
    this.root.setProperty('--k2', k2.toFixed(3));
    this.root.setProperty('--dip', dip.toFixed(3));
    const gl = this.gl;
    if (gl) {
      gl.uniform2f(this.uniforms.R, this.fog.nativeElement.width, this.fog.nativeElement.height);
      gl.uniform1f(this.uniforms.T, now / 1000);
      gl.uniform1f(this.uniforms.S, surge);
      gl.uniform1f(this.uniforms.K, this.k);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  private releaseFog(): void {
    if (this.gl) {
      for (const shader of this.shaders) this.gl.deleteShader(shader);
      if (this.program) this.gl.deleteProgram(this.program);
    }
    this.shaders = [];
    this.program = null;
    this.gl = null;
    this.uniforms = { R: null, T: null, S: null, K: null };
  }

  ngOnDestroy(): void {
    this.heroObserver?.disconnect();
    this.destroyed = true;
    ++this.requestId;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    this.motion.removeEventListener('change', this.motionChanged);
    this.fog.nativeElement.removeEventListener('webglcontextlost', this.contextLost);
    this.fog.nativeElement.removeEventListener('webglcontextrestored', this.contextRestored);
    for (const cleanup of this.listenerCleanups) cleanup();
    this.releaseFog();
  }
}

const VERTEX_SOURCE = `#version 300 es
  void main(){
    vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
    gl_Position=vec4(p*2.-1.,0,1);
  }`;

const FRAGMENT_SOURCE = `#version 300 es
  precision highp float;

  uniform vec2 R;
  uniform float T,S,K;
  out vec4 O;


  // Defined explicitly so reversed edges retain the reference's intended behavior.
  float smooth2(float a,float b,float x){
    float q=clamp((x-a)/(b-a),0.,1.);
    return q*q*(3.-2.*q);
  }

  float h(vec2 p){
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
  }

  float n(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(
      mix(h(i),h(i+vec2(1,0)),f.x),
      mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),
      f.y
    );
  }

  float fbm(vec2 p){
    float a=.5,s=0.;
    mat2 m=mat2(1.6,1.2,-1.2,1.6);
    p=mat2(.8,.6,-.6,.8)*p+5.3;

    for(int i=0;i<5;i++){
      s+=a*n(p);
      p=m*p;
      a*=.5;
    }

    return s;
  }

  void main(){

    vec2 uv=gl_FragCoord.xy/R;
    uv.y=1.-uv.y;

    float asp=R.x/R.y;
    vec2 p=vec2(uv.x*asp,uv.y);

    float t=T*.05;

    vec2 w=vec2(
      fbm(p*1.3+vec2(t,-t*.6)),
      fbm(p*1.3+vec2(-t*.8,t)+7.)
    );

    float d=fbm(p*1.9+w*1.7+vec2(t*1.6,-t*1.1+S*.5));
    float e=fbm(p*.9-w+vec2(-t,t*.5)+3.);

    float low=smooth2(.70,1.04,uv.y+(d-.5)*.34);

    float side=smooth2(.2,.0,uv.x+(e-.5)*.28)
              +smooth2(.8,1.,uv.x+(e-.5)*.28);

    side*=smooth2(.25,.6,uv.y)*.2;

    float wisps=smooth2(.5,.78,d)
               *smooth2(.22,.5,uv.y)
               *smooth2(.86,.6,uv.y)*.18;

    float rest=clamp(low+side+wisps,0.,1.);

    float front=1.02-S*.68;

    float rise=smooth2(
      front-.02,
      front+.26,
      uv.y+(d-.5)*.5
    );

    float haze=S*(.3+.46*d);

    float a=clamp(
      max(rest,max(rise*.97,haze)),
      0.,
      1.
    );

    vec3 dayA=vec3(.97,.93,.84);
    vec3 dayB=vec3(.79,.78,.71);

    vec3 nitA=vec3(.40,.45,.57);
    vec3 nitB=vec3(.15,.19,.29);

    vec3 c=mix(
      mix(dayB,dayA,d*1.15),
      mix(nitB,nitA,d*1.1),
      K
    );

    float porch=exp(
      -dot(
        (uv-vec2(.72,.74))*vec2(1.7,2.6),
        (uv-vec2(.72,.74))*vec2(1.7,2.6)
      )*3.2
    );

    c=mix(
      c,
      vec3(.86,.55,.27),
      K*porch*.42*(1.-S)
    );

    O=vec4(c*a,a);
  }`;

