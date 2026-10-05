import { useEffect, useRef } from 'react';

/* ------------------------------------------------------------------
 * Geometría extraída de logo-analytics.svg (viewBox original 896x912)
 * ------------------------------------------------------------------ */

// Anillo principal (path original, desplazado -3,-2 respecto al artboard)
const RING_PATH =
  'M898.966,455.5C900.156,561.192 853.614,648.356 845.522,663.512C725.559,888.182 425.736,977.713 195.24,818.876C-36.281,659.333 -67.138,316.007 150.124,119.086C360.184,-71.309 697.849,-23.807 843.001,233.773C880.953,301.122 900.52,384.127 898.966,455.5ZM834.019,450.503C830.867,667.364 676.274,787.377 551.544,820.652C259.106,898.669 -2.431,626.228 84.807,338.592C151.687,118.079 404.689,2.445 618.495,106.511C649.369,121.538 829.9,214.039 834.019,450.503Z';

// Pelota (path original, forma orgánica ligeramente irregular)
const BALL_PATH =
  'M131.95,76.547C129.795,112.503 80.459,155.199 27.814,120.128C21.382,115.843 14.738,106.645 13.782,105.322C-14.228,66.54 9.448,1.216 70.505,2.199C98.682,2.652 138.673,29.783 131.95,76.547Z';
const BALL_CENTER = { x: 68, y: 71 }; // centro aproximado del path de la pelota

const CENTER = { x: 445, y: 453 }; // centro del anillo
const ORBIT_R = 414; // radio de la órbita (centro del trazo del anillo)
const BALL_ANGLES = [-55.4, 75, 214.6]; // posiciones originales (grados)

// Barras
const BAR_W = 131;
const BAR_BOTTOM = 684;
const BAR_XS = [189, 381, 573];
const BAR_INITIAL = [265, 503, 382];
const BAR_MIN = BAR_W; // altura mínima = círculo
const BAR_MAX = 505;

// viewBox ampliado para que las pelotas no se recorten al orbitar
const VIEWBOX = `${CENTER.x - 490} ${CENTER.y - 490} 980 980`;

/* ------------------------------------------------------------------
 * Utilidades de aleatoriedad orgánica
 * ------------------------------------------------------------------ */
const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Onda pseudo-aleatoria suave en [-1, 1]: suma de senos con
 * frecuencias inconmensurables → nunca repite exactamente la secuencia.
 */
function makeWave(components = 3, minF = 0.05, maxF = 0.3) {
  const parts = Array.from({ length: components }, () => ({
    f: rand(minF, maxF),
    p: rand(0, Math.PI * 2),
    a: rand(0.4, 1),
  }));
  const total = parts.reduce((s, c) => s + c.a, 0);
  return (t) =>
    parts.reduce((s, c) => s + c.a * Math.sin(Math.PI * 2 * c.f * t + c.p), 0) / total;
}

/**
 * Logo Analytics animado.
 *
 * @param {number}  size        Tamaño en px (ancho/alto).
 * @param {string}  ringColor   Color del anillo.
 * @param {string}  accentColor Color de pelotas y barras.
 * @param {number}  speed       Multiplicador de velocidad de órbita.
 * @param {number}  energy      Multiplicador de actividad del gráfico de barras.
 * @param {boolean} paused      Pausa la animación.
 */
export default function AnimatedLogo({
  size = 420,
  ringColor = 'rgb(22,23,25)',
  accentColor = 'rgb(8,171,226)',
  speed = 1,
  energy = 1,
  paused = false,
  className = '',
  title = 'Logo Analytics animado',
}) {
  const ballRefs = useRef([]);
  const barRefs = useRef([]);
  const opts = useRef({ speed, energy, paused });
  opts.current = { speed, energy, paused };

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // --- Estado de las órbitas ---
    const speedWave = makeWave(3, 0.02, 0.09); // variación de velocidad global
    const offsetWaves = BALL_ANGLES.map(() => makeWave(3, 0.03, 0.15)); // desfase individual
    const wobbleWaves = BALL_ANGLES.map(() => makeWave(2, 0.1, 0.35)); // respiración radial
    let rotation = 0; // grados acumulados
    let time = 0;

    // --- Estado de las barras (física de resorte) ---
    const bars = BAR_INITIAL.map((h) => ({
      h,
      v: 0,
      target: h,
      next: rand(0.3, 1.2),
    }));

    const pickTarget = (bar) => {
      let t;
      let tries = 0;
      do {
        t = rand(BAR_MIN, BAR_MAX);
        tries++;
      } while (Math.abs(t - bar.h) < 90 && tries < 8);
      return t;
    };

    const render = () => {
      ballRefs.current.forEach((el, i) => {
        if (!el) return;
        const angle =
          ((BALL_ANGLES[i] + rotation + 20 * offsetWaves[i](time)) * Math.PI) / 180;
        const r = ORBIT_R + 6 * wobbleWaves[i](time);
        const x = CENTER.x + r * Math.cos(angle) - BALL_CENTER.x;
        const y = CENTER.y + r * Math.sin(angle) - BALL_CENTER.y;
        el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      });
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const h = Math.max(BAR_MIN, bars[i].h);
        el.setAttribute('y', (BAR_BOTTOM - h).toFixed(2));
        el.setAttribute('height', h.toFixed(2));
      });
    };

    render();
    if (reduceMotion) return undefined;

    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const { speed: spd, energy: nrg, paused: isPaused } = opts.current;

      if (!isPaused) {
        time += dt;

        // Órbita: velocidad base ±60% modulada por ruido suave
        const angularSpeed = 26 * spd * (1 + 0.6 * speedWave(time));
        rotation = (rotation + angularSpeed * dt) % 360;

        // Barras: nuevos objetivos a intervalos aleatorios + resorte
        const stiffness = 90 + 40 * nrg;
        const damping = 11;
        bars.forEach((bar) => {
          bar.next -= dt * nrg;
          if (bar.next <= 0) {
            bar.target = pickTarget(bar);
            bar.next = rand(0.6, 2.2);
          }
          const acc = stiffness * (bar.target - bar.h) - damping * bar.v;
          bar.v += acc * dt;
          bar.h += bar.v * dt;
          if (bar.h > BAR_MAX + 25) {
            bar.h = BAR_MAX + 25;
            bar.v = 0;
          }
        });

        render();
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={VIEWBOX}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <title>{title}</title>
      <g transform="translate(-3 -2)">
        <path d={RING_PATH} fill={ringColor} fillRule="evenodd" style={{ transition: 'fill 0.5s ease' }} />
      </g>

      <g fill={accentColor}>
        {BAR_XS.map((x, i) => (
          <rect
            key={`bar-${i}`}
            ref={(el) => (barRefs.current[i] = el)}
            x={x}
            y={BAR_BOTTOM - BAR_INITIAL[i]}
            width={BAR_W}
            height={BAR_INITIAL[i]}
            rx={BAR_W / 2}
          />
        ))}
        {BALL_ANGLES.map((_, i) => (
          <g key={`ball-${i}`} ref={(el) => (ballRefs.current[i] = el)}>
            <path d={BALL_PATH} />
          </g>
        ))}
      </g>
    </svg>
  );
}
