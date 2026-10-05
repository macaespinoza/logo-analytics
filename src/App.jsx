import { useState } from 'react';
import AnimatedLogo from './components/AnimatedLogo.jsx';

export default function App() {
  const [dark, setDark] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [energy, setEnergy] = useState(1);
  const [paused, setPaused] = useState(false);

  return (
    <div className={`app ${dark ? 'theme-dark' : 'theme-light'}`}>
      <div className="bg-glow bg-glow--a" />
      <div className="bg-glow bg-glow--b" />

      <header className="topbar">
        <span className="brand">
          <span className="brand-dot" /> Analytics
        </span>
        <button
          id="theme-toggle"
          className="chip"
          onClick={() => setDark((d) => !d)}
          aria-label="Cambiar tema"
        >
          {dark ? '☀︎ Claro' : '☾ Oscuro'}
        </button>
      </header>

      <main className="stage">
        <section className="logo-wrap" aria-label="Logo animado">
          <div className="logo-halo" />
          <AnimatedLogo
            className="logo"
            size={440}
            ringColor={dark ? '#EEF1F6' : 'rgb(22,23,25)'}
            speed={speed}
            energy={energy}
            paused={paused}
          />
        </section>

        <section className="copy">
          <h1>
            Datos en <span className="accent">movimiento</span>
          </h1>
          <p>
            Loop orgánico: las órbitas cambian de ritmo de forma continua y el gráfico de
            barras reacciona con valores aleatorios y física de resorte.
          </p>
        </section>

        <section className="panel" aria-label="Controles de animación">
          <label className="control" htmlFor="speed-slider">
            <span>
              Velocidad órbita <b>{speed.toFixed(1)}×</b>
            </span>
            <input
              id="speed-slider"
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
          <label className="control" htmlFor="energy-slider">
            <span>
              Actividad barras <b>{energy.toFixed(1)}×</b>
            </span>
            <input
              id="energy-slider"
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
            />
          </label>
          <button id="pause-toggle" className="btn" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶ Reanudar' : '❚❚ Pausar'}
          </button>
        </section>
      </main>
    </div>
  );
}
