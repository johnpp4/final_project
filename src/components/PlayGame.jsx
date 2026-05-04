import { forwardRef, useCallback, useState } from "react";
import {
  fetchRound,
  normalizeRound,
  percentToDeg,
  scoreBand,
} from "../api/wavelength.js";

const PlayGame = forwardRef(function PlayGame(_, ref) {
  const [phase, setPhase] = useState("idle");
  const [round, setRound] = useState(null);
  const [psychicPlacePct, setPsychicPlacePct] = useState(50);
  const [guessPct, setGuessPct] = useState(50);
  const [topicLine, setTopicLine] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusSub, setStatusSub] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [revealScore, setRevealScore] = useState("");

  const hasRound = !!round;
  const targetLocked =
    hasRound && typeof round.targetPercent === "number" && !Number.isNaN(round.targetPercent);

  const placementPct =
    phase === "psychic_place" ? psychicPlacePct : targetLocked ? round.targetPercent : 50;
  const targetDeg = percentToDeg(placementPct);
  const guessDeg = percentToDeg(guessPct);

  const runGenerate = useCallback(async () => {
    if (phase === "loading") return;
    setRound(null);
    setRevealScore("");
    setPhase("loading");
    setStatusMsg("Generating your wave…");
    setStatusSub("");
    setStatusError(false);
    try {
      const raw = await fetchRound(topicLine);
      const r = normalizeRound(raw);
      setRound(r);
      setPsychicPlacePct(50);
      setGuessPct(50);
      setPhase("psychic_place");
      setStatusMsg("Round ready.");
      setStatusSub(
        "Psychic: drag the slider to place the target on the spectrum, then tap Lock target."
      );
    } catch (err) {
      setStatusMsg(err.message || "Something went wrong.");
      setStatusSub("");
      setStatusError(true);
      setRound(null);
      setPhase("idle");
    }
  }, [phase, topicLine]);

  function lockTargetAndPass() {
    if (phase !== "psychic_place" || !round) return;
    const t = Math.max(0, Math.min(100, Math.round(psychicPlacePct)));
    setRound({ ...round, targetPercent: t });
    setGuessPct(50);
    setPhase("guess");
    setStatusMsg("Guesser: move the slider, then tap Reveal Wave.");
    setStatusSub("");
    setStatusError(false);
  }

  function doReveal() {
    if (phase !== "guess" || !round || !targetLocked) return;
    setPhase("revealed");
    let guess = guessPct;
    if (Number.isNaN(guess)) guess = 50;
    const delta = guess - round.targetPercent;
    const band = scoreBand(delta);
    setRevealScore(band.label);
    setStatusMsg("");
    setStatusSub("");
  }

  function returnToIdle() {
    setRound(null);
    setPhase("idle");
    setPsychicPlacePct(50);
    setStatusMsg("");
    setStatusSub("");
    setStatusError(false);
    setRevealScore("");
    setGuessPct(50);
  }

  const labels = round
    ? { left: round.topicLeft, right: round.topicRight }
    : { left: "Topic 1", right: "Topic 2" };

  return (
    <section
      ref={ref}
      id="play-game"
      className="section section--game section--reveal"
      aria-label="Play Game"
      data-phase={phase}
    >
      <h2 className="game-title">Play Game</h2>

      <div
        className={"game-status-wrap" + (statusError ? " is-error" : "")}
        role="status"
        aria-live="polite"
      >
        {statusMsg ? <p className="game-status">{statusMsg}</p> : null}
        {statusSub ? (
          <p className="game-status game-status--sub">{statusSub}</p>
        ) : null}
      </div>

      <div className="dial-stack">
        <div className="dial-wrap">
          <div className="dial" aria-hidden="true">
            <div className="dial__face" />
            <div className="dial__pointers">
              <div
                className="dial__pointer dial__pointer--target"
                style={{ transform: `rotate(${targetDeg}deg)` }}
              />
              <div
                className="dial__pointer dial__pointer--guess"
                style={{ transform: `rotate(${guessDeg}deg)` }}
              />
            </div>
          </div>
        </div>
        {round ? (
          <div className="spectrum-under-dial">
            <span className="spectrum-under-dial__left">{labels.left}</span>
            <span className="spectrum-under-dial__right">{labels.right}</span>
          </div>
        ) : null}
      </div>

      {round ? (
        <p className="clue-banner">
          <span className="clue-banner__label">Clue</span>
          <span className="clue-banner__word">{round.clueWord}</span>
        </p>
      ) : null}

      {phase === "psychic_place" ? (
        <div className="wave-slider-block wave-slider-block--psychic">
          <p className="psychic-slider-hint">Place the target on the spectrum</p>
          <div
            className="wave-slider-track"
            style={{ "--handle-x": `${psychicPlacePct}%` }}
          >
            <input
              type="range"
              className="wave-slider"
              min={0}
              max={100}
              value={psychicPlacePct}
              onChange={(e) => setPsychicPlacePct(Number(e.target.value))}
              aria-label="Set target position on the spectrum"
            />
          </div>
        </div>
      ) : null}

      {phase === "guess" || phase === "revealed" ? (
        <div className="wave-slider-block">
          <div
            className="wave-slider-track"
            style={{ "--handle-x": `${guessPct}%` }}
          >
            <input
              type="range"
              className="wave-slider"
              min={0}
              max={100}
              value={guessPct}
              disabled={phase !== "guess"}
              onChange={(e) => setGuessPct(Number(e.target.value))}
              aria-label="Guess where the clue sits on the spectrum"
            />
          </div>
        </div>
      ) : null}

      {phase === "psychic_place" ? (
        <div className="phase-actions">
          <button type="button" className="phase-btn phase-btn--primary" onClick={lockTargetAndPass}>
            Lock target & pass to guesser
          </button>
        </div>
      ) : null}

      <div className="topic-panel">
        <p className="topic-panel__heading">Generate Wave Topic</p>
        <div className="topic-panel__row">
          <input
            type="text"
            className="topic-input"
            placeholder="Describe the topic you want to play..."
            autoComplete="off"
            value={topicLine}
            onChange={(e) => setTopicLine(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runGenerate()}
            disabled={phase === "loading"}
          />
          <button
            type="button"
            className="topic-send"
            onClick={runGenerate}
            disabled={phase === "loading"}
            aria-label="Generate topic"
          >
            <span aria-hidden="true">↑</span>
          </button>
        </div>
        {hasRound && phase !== "loading" ? (
          <button type="button" className="topic-panel__new-topic" onClick={returnToIdle}>
            New topic
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="reveal-button"
        disabled={phase !== "guess"}
        onClick={doReveal}
      >
        Reveal Wave
      </button>

      {phase === "revealed" && round ? (
        <div className="reveal-result">
          <p className="reveal-result__score">{revealScore}</p>
          <p className="reveal-result__detail">Clue: “{round.clueWord}”</p>
          <p className="reveal-result__spectrum">
            {round.topicLeft} ↔ {round.topicRight}
          </p>
          <button type="button" className="phase-btn phase-btn--ghost" onClick={returnToIdle}>
            New round
          </button>
        </div>
      ) : null}
    </section>
  );
});

export default PlayGame;
