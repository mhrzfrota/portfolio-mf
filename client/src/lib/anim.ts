import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sistema declarativo de animação por atributo `data-anim`.
 *
 * O CSS inicia todo `[data-anim]` com `visibility: hidden`; aqui montamos o
 * estado inicial de cada elemento e só então liberamos a visibilidade num
 * único passe (`html.anim-ready`), o que evita o flash de conteúdo sem estilo.
 *
 * O disparo é "esperto": elemento já visível no carregamento toca na hora;
 * elemento abaixo da dobra ganha um ScrollTrigger em `top 85%` com `once`.
 */

const EASE_OUT = "power2.out";
const EASE_STRONG = "power3.out";
const EASE_BACK = "back.out(1.4)";
const EASE_POP = "back.out(2)";

/** Distância da borda inferior em que o gatilho considera o bloco "à vista". */
const TRIGGER_START = "top 85%";

type Ctx = { el: HTMLElement; tl: gsap.core.Timeline };

function num(el: HTMLElement, attr: string, fallback: number): number {
  const raw = el.getAttribute(attr);
  if (raw === null) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Alvos da variante: por padrão o próprio elemento, ou os filhos quando a
 * variante é de stagger. `data-anim-target` aceita um seletor para os casos em
 * que os filhos diretos não são o que deve animar.
 */
function targets(el: HTMLElement, childSelector?: string): Element[] {
  const custom = el.getAttribute("data-anim-target");
  if (custom) return Array.from(el.querySelectorAll(custom));
  if (childSelector) return Array.from(el.querySelectorAll(childSelector));
  return Array.from(el.children);
}

/* ---------- Variantes ---------- */

function heroWords({ el, tl }: Ctx) {
  const words = targets(el, ".split-word");
  if (words.length === 0) return;
  gsap.set(words, { opacity: 0, y: 24, filter: "blur(8px)" });
  tl.to(words, {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.8,
    stagger: 0.08,
    ease: EASE_STRONG,
  });
}

function fadeUp({ el, tl }: Ctx) {
  const items = el.hasAttribute("data-anim-children")
    ? targets(el)
    : [el as Element];
  gsap.set(items, { opacity: 0, y: 10 });
  tl.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: 0.1,
    ease: EASE_OUT,
  });
}

function cardReveal({ el, tl }: Ctx) {
  const items = el.hasAttribute("data-anim-children")
    ? targets(el)
    : [el as Element];
  gsap.set(items, { opacity: 0, scale: 0.92 });
  tl.to(items, {
    opacity: 1,
    scale: 1,
    duration: 0.55,
    stagger: 0.1,
    ease: EASE_STRONG,
  });
}

function staggerText({ el, tl }: Ctx) {
  const items = targets(el);
  gsap.set(items, { opacity: 0, y: 12 });
  tl.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.35,
    stagger: 0.09,
    ease: EASE_OUT,
  });
}

function staggerRows({ el, tl }: Ctx) {
  const items = targets(el);
  gsap.set(items, { opacity: 0, x: 20 });
  tl.to(items, {
    opacity: 1,
    x: 0,
    duration: 0.4,
    stagger: 0.1,
    ease: EASE_OUT,
  });
}

function barGrow({ el, tl }: Ctx) {
  const bars = targets(el, "[data-anim-bar]");
  const labels = Array.from(el.querySelectorAll("[data-anim-bar-label]"));
  if (bars.length > 0) {
    gsap.set(bars, { scaleY: 0, transformOrigin: "bottom center" });
    tl.to(bars, {
      scaleY: 1,
      duration: 0.6,
      stagger: 0.09,
      ease: EASE_BACK,
    });
  }
  if (labels.length > 0) {
    gsap.set(labels, { opacity: 0, y: 6 });
    tl.to(
      labels,
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: EASE_OUT },
      0.15
    );
  }
}

function progress({ el, tl }: Ctx) {
  const bars = targets(el, "[data-anim-value]");
  bars.forEach(bar => {
    const target = num(bar as HTMLElement, "data-anim-value", 0);
    gsap.set(bar, { width: "0%" });
    tl.to(bar, { width: `${target}%`, duration: 1.1, ease: "power2.inOut" }, 0);
  });
}

/** Distribui as pílulas por ângulo em torno do centro do contêiner. */
function orbitReveal({ el, tl }: Ctx) {
  const rings = Array.from(el.querySelectorAll(".orbit-ring"));
  const pills = Array.from(el.querySelectorAll<HTMLElement>(".orbit-pill"));

  if (rings.length > 0) {
    gsap.set(rings, { opacity: 0 });
    tl.to(rings, { opacity: 1, duration: 0.25, stagger: 0.08 });
  }

  pills.forEach((pill, index) => {
    const angle = num(pill, "data-orbit-angle", index * 120) * (Math.PI / 180);
    const radius = num(pill, "data-orbit-radius", 40);
    gsap.set(pill, {
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      scale: 0,
    });
  });

  if (pills.length > 0) {
    tl.to(
      pills,
      { opacity: 1, scale: 1, duration: 0.45, stagger: 0.1, ease: EASE_POP },
      0.2
    );
  }
}

/** Flutuação contínua e dessincronizada — não entra em timeline de entrada. */
function pillFloat(el: HTMLElement) {
  const items = el.querySelectorAll<HTMLElement>("[data-anim-float]");
  items.forEach((item, index) => {
    gsap.to(item, {
      y: index % 2 === 0 ? -6 : 6,
      duration: 2 + index * 0.35,
      delay: index * 0.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  });
}

/**
 * O conteúdo já vem duplicado pelo componente React, então percorrer metade da
 * largura cai num quadro visualmente idêntico ao inicial e o `repeat` fecha
 * sozinho, sem emenda.
 */
function marquee(el: HTMLElement, direction: -1 | 1) {
  const track = el.querySelector<HTMLElement>(".marquee-track");
  if (!track) return;

  const half = track.scrollWidth / 2;
  if (half <= 0) return;

  const speed = num(el, "data-anim-speed", 40); // px/s
  gsap.set(track, { x: direction < 0 ? 0 : -half });

  const tween = gsap.to(track, {
    x: direction < 0 ? -half : 0,
    duration: half / speed,
    ease: "none",
    repeat: -1,
  });

  el.addEventListener("mouseenter", () => tween.pause());
  el.addEventListener("mouseleave", () => tween.resume());
}

function counter(el: HTMLElement, tl: gsap.core.Timeline) {
  const to = num(el, "data-anim-to", 0);
  const from = num(el, "data-anim-from", 0);
  const suffix = el.getAttribute("data-anim-suffix") ?? "";
  const state = { value: from };

  el.textContent = `${Math.round(from)}${suffix}`;
  tl.to(state, {
    value: to,
    duration: 1.2,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = `${Math.round(state.value)}${suffix}`;
    },
  });
}

/* ---------- Runtime ---------- */

const BUILDERS: Record<string, (ctx: Ctx) => void> = {
  "hero-words": heroWords,
  "fade-up": fadeUp,
  "card-reveal": cardReveal,
  "stagger-text": staggerText,
  "stagger-rows": staggerRows,
  "bar-grow": barGrow,
  progress,
  "orbit-reveal": orbitReveal,
};

function setup(el: HTMLElement, triggers: ScrollTrigger[]) {
  const variant = el.getAttribute("data-anim");
  if (!variant) return;

  // Loops contínuos não têm entrada: montam e seguem sozinhos.
  if (variant === "marquee-left") return marquee(el, -1);
  if (variant === "marquee-right") return marquee(el, 1);
  if (variant === "pill-float") return pillFloat(el);

  const tl = gsap.timeline({
    paused: true,
    delay: num(el, "data-anim-delay", 0),
  });

  if (variant === "count") counter(el, tl);
  else BUILDERS[variant]?.({ el, tl });

  // Smart trigger: acima da dobra toca já; abaixo espera o scroll.
  const top = el.getBoundingClientRect().top;
  if (top < window.innerHeight * 0.85) {
    tl.play();
    return;
  }

  triggers.push(
    ScrollTrigger.create({
      trigger: el,
      start: TRIGGER_START,
      once: true,
      onEnter: () => tl.play(),
    })
  );
}

/**
 * Monta as animações de todos os `[data-anim]` ainda não processados e libera
 * a visibilidade. Devolve a função de limpeza.
 */
export function initAnimations(): () => void {
  const root = document.documentElement;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Com movimento reduzido nada anima, mas o conteúdo não pode ficar oculto.
  if (reduced) {
    root.classList.add("anim-ready");
    return () => {};
  }

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-anim]:not([data-anim-done])")
  );

  const triggers: ScrollTrigger[] = [];
  const tweened: HTMLElement[] = [];

  // O `finally` não é decoração: o CSS esconde todo [data-anim] até esta
  // classe entrar. Se qualquer variante lançar, a página inteira ficaria em
  // branco — melhor perder a animação do que perder o conteúdo.
  try {
    elements.forEach(el => {
      el.setAttribute("data-anim-done", "");
      tweened.push(el);
      setup(el, triggers);
    });
  } finally {
    root.classList.add("anim-ready");
  }

  return () => {
    triggers.forEach(trigger => trigger.kill());
    tweened.forEach(el => {
      gsap.killTweensOf(el);
      gsap.killTweensOf(el.children);
      el.removeAttribute("data-anim-done");
    });
  };
}
