export default function SiteHeader({ activeSection }) {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary">
        <a
          href="#home"
          className={"nav-link" + (activeSection === "home" ? " is-active" : "")}
          aria-current={activeSection === "home" ? "page" : undefined}
        >
          <span className="nav-link__play" aria-hidden="true">
            ▶
          </span>{" "}
          Home
        </a>
        <a
          href="#how-to-play"
          className={"nav-link" + (activeSection === "howto" ? " is-active" : "")}
          aria-current={activeSection === "howto" ? "page" : undefined}
        >
          How to Play
        </a>
        <a
          href="#play-game"
          className={"nav-link" + (activeSection === "game" ? " is-active" : "")}
          aria-current={activeSection === "game" ? "page" : undefined}
        >
          Play Game
        </a>
      </nav>
    </header>
  );
}
