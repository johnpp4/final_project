import { useCallback, useEffect, useRef, useState } from "react";
import SiteHeader from "./components/SiteHeader.jsx";
import PlayGame from "./components/PlayGame.jsx";

const WAVE_LABEL = "Wavelength";
const WAVE_STEP_S = 0.15;
const WAVE_DURATION_S = 2;

function docTop(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [wavePlaying, setWavePlaying] = useState(false);
  const howRef = useRef(null);
  const gameRef = useRef(null);
  const waveEndTimerRef = useRef(null);

  const clearWaveEndTimer = useCallback(() => {
    if (waveEndTimerRef.current != null) {
      clearTimeout(waveEndTimerRef.current);
      waveEndTimerRef.current = null;
    }
  }, []);

  const handleWaveTitleEnter = useCallback(() => {
    if (wavePlaying) return;
    setWavePlaying(true);
    clearWaveEndTimer();
    const totalS =
      WAVE_DURATION_S + (WAVE_LABEL.length - 1) * WAVE_STEP_S;
    waveEndTimerRef.current = window.setTimeout(() => {
      setWavePlaying(false);
      waveEndTimerRef.current = null;
    }, totalS * 1000);
  }, [wavePlaying, clearWaveEndTimer]);

  useEffect(() => {
    function updateNav() {
      const header = document.querySelector(".site-header");
      const headerH = header ? header.getBoundingClientRect().height : 56;
      const y = window.scrollY + headerH + 12;
      let key = "home";
      if (howRef.current && y >= docTop(howRef.current)) key = "howto";
      if (gameRef.current && y >= docTop(gameRef.current)) key = "game";
      setActiveSection(key);
    }
    window.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav, { passive: true });
    updateNav();
    return () => {
      window.removeEventListener("scroll", updateNav);
      window.removeEventListener("resize", updateNav);
    };
  }, []);

  useEffect(() => {
    function revealWhenSeen(sectionRef) {
      const el = sectionRef.current;
      if (!el) return () => {};
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("section--visible");
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }
    const stopHow = revealWhenSeen(howRef);
    const stopGame = revealWhenSeen(gameRef);
    return () => {
      stopHow();
      stopGame();
    };
  }, []);

  useEffect(() => () => clearWaveEndTimer(), [clearWaveEndTimer]);

  function scrollToHowTo() {
    howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <SiteHeader activeSection={activeSection} />
      <main>
        <section
          id="home"
          className="section section--hero section--reveal section--visible"
          aria-label="Home"
        >
          <div className="hero-content">
            <h1
              className={
                "title-main wave-text" +
                (wavePlaying ? " wave-text--playing" : "")
              }
              aria-label="Wavelength"
              onMouseEnter={handleWaveTitleEnter}
            >
              {WAVE_LABEL.split("").map((ch, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * WAVE_STEP_S}s` }}
                >
                  {ch}
                </span>
              ))}
            </h1>
            <p className="subtitle">Are you riding the same wave?</p>
            <button
              type="button"
              className="scroll-hint"
              onClick={scrollToHowTo}
              aria-label="Scroll to How to Play"
            >
              <span className="scroll-hint__arrow" aria-hidden="true">
                ↓
              </span>
            </button>
          </div>
        </section>

        <section
          ref={howRef}
          id="how-to-play"
          className="section section--howto section--reveal"
          aria-label="How to Play"
        >
          <div className="instructions-content">
            <h2 className="instructions-title">How to Play</h2>
            <div className="instruction-box instruction-box--text">
              <p>
                Describe a theme in the box (for example, “outer space” or “things at a party”).
                The AI invents two opposite ends of a spectrum and a clue word that belongs
                somewhere between them.
              </p>
            </div>
            <div className="instruction-box instruction-box--text">
              <p>
                <strong>Psychic</strong> reads the clue and uses the slider to place the target on
                the spectrum. They tap <strong>Lock target</strong>{" "}
                and pass the device, the guesser never sees where they put it.
              </p>
            </div>
            <div className="instruction-box instruction-box--text">
              <p>
                <strong>Guesser</strong> does not see the target. They move the slider to show where
                they think the clue belongs between the two topics. Feel free to openly discuss and debate
                where you think the target is!
              </p>
            </div>
            <div className="instruction-box instruction-box--text">
              <p>
                Tap <strong>Reveal Wave</strong> to compare the guess to the hidden target and see
                how close you were. Then play another round with a new theme and/or switch roles.
              </p>
            </div>
          </div>
        </section>

        <PlayGame ref={gameRef} />
      </main>
    </>
  );
}
