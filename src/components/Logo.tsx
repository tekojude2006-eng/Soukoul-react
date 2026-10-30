"use client";

const PIECE_CENTER_BEAM =
  "M211.0 27.6L234.0 27.3L251.0 30.3L268.0 37.3L283.9 48.5L406.0 169.0L545.0 308.0L552.7 317.0L553.9 322.9L549.8 329.5L534.0 342.8L518.0 353.5L505.0 360.4L488.0 367.2L472.0 371.7L456.0 374.3L422.0 374.8L398.0 370.8L383.0 366.4L369.0 360.5L342.0 345.1L329.0 334.7L312.4 318.6L172.1 178.0L153.7 156.9L143.5 138.0L138.7 116.0L138.5 107.0L139.9 96.0L145.5 77.0L156.9 58.0L172.0 43.6L191.0 32.7Z";

const PIECE_LEFT_LOBE =
  "M86.0 182.6L102.0 182.1L113.0 183.7L124.0 188.0L136.0 195.7L152.0 210.0L235.5 293.8L243.0 303.4L242.8 309.1L237.8 315.8L225.0 327.0L210.0 336.8L196.0 343.7L180.0 349.6L151.0 355.1L131.0 355.8L107.0 352.7L91.0 348.7L71.0 340.5L54.0 330.0L40.3 317.9L30.3 305.0L21.9 289.0L17.4 272.0L16.4 255.0L20.2 236.0L26.8 221.0L37.3 207.2L52.0 195.3L69.0 186.8Z";

const PIECE_TOP_DOME =
  "M417.0 7.5L429.0 7.2L440.0 8.6L453.0 12.6L463.0 17.5L473.0 24.7L481.4 33.0L488.6 43.0L493.4 53.0L496.8 65.0L498.4 78.0L497.7 89.0L495.0 101.0L490.6 112.0L483.9 123.0L473.8 135.0L466.0 141.8L460.0 143.0L452.0 137.9L366.0 51.8L360.1 44.0L359.8 39.3L362.6 34.7L380.0 20.7L397.0 12.4Z";

const PIECE_RIGHT_DOME =
  "M549.0 131.5L561.0 131.7L576.0 134.5L587.0 138.4L599.0 145.0L608.9 152.5L618.0 162.0L626.2 174.0L631.4 185.0L634.9 198.0L636.6 212.0L635.6 225.0L632.6 238.0L627.4 251.0L620.6 262.0L609.8 274.7L602.0 280.1L596.0 279.9L588.0 273.9L493.2 178.1L487.6 170.7L487.6 166.0L491.4 160.4L512.0 143.9L529.0 135.6Z";

export function Logo({
  size = 36,
  light = false,
  animated = false,
  className = "",
}: {
  size?: number;
  light?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const fill = light ? "#f4efe6" : "var(--ink, #1c1915)";
  const width = Math.round(size * 1.48);
  const height = Math.round(size * 0.87);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 653 382"
      fill="none"
      aria-label="Soukoul"
      className={`${animated ? "soukoul-logo-animated" : "soukoul-logo"} ${className}`}
      style={{ overflow: "visible" }}
    >
      <path d={PIECE_CENTER_BEAM} fill={fill} className="logo-piece logo-piece-beam" />
      <path d={PIECE_LEFT_LOBE} fill={fill} className="logo-piece logo-piece-lobe" />
      <path d={PIECE_TOP_DOME} fill={fill} className="logo-piece logo-piece-dome-1" />
      <path d={PIECE_RIGHT_DOME} fill={fill} className="logo-piece logo-piece-dome-2" />
    </svg>
  );
}

export function SplashLoader({
  exiting = false,
  subtitle = "Préparation de votre espace académique",
}: {
  exiting?: boolean;
  subtitle?: string;
}) {
  return (
    <div
      id="splash-screen"
      className={`soukoul-splash ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Chargement de l'Université Soukoul"
    >
      {/* Subtle architectural drafting lines */}
      <div className="soukoul-splash-grid" aria-hidden />

      <div className="soukoul-splash-stage">
        {/* Architectural compass & diagonal construction frame */}
        <div className="soukoul-emblem-frame">
          <svg
            className="soukoul-compass-ring"
            viewBox="0 0 220 220"
            fill="none"
            aria-hidden
          >
            {/* Outer fine degree ring */}
            <circle
              cx="110"
              cy="110"
              r="98"
              stroke="var(--ink)"
              strokeOpacity="0.11"
              strokeWidth="1"
            />
            {/* Animated golden-ochre meridian arc */}
            <circle
              cx="110"
              cy="110"
              r="98"
              stroke="#8f2436"
              strokeOpacity="0.55"
              strokeWidth="1.25"
              strokeDasharray="110 510"
              strokeLinecap="round"
              className="soukoul-compass-arc"
            />
            {/* Inner editorial measurement circle */}
            <circle
              cx="110"
              cy="110"
              r="76"
              stroke="var(--ink)"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            {/* 45° construction axis matching the logo's diagonal */}
            <line
              x1="34"
              y1="34"
              x2="186"
              y2="186"
              stroke="var(--ink)"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            {/* Cardinal tick marks */}
            <line x1="110" y1="6" x2="110" y2="14" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="1" />
            <line x1="110" y1="206" x2="110" y2="214" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="1" />
            <line x1="6" y1="110" x2="14" y2="110" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="1" />
            <line x1="206" y1="110" x2="214" y2="110" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="1" />
          </svg>

          {/* The 4-piece geometric Soukoul mark */}
          <div className="soukoul-emblem-mark">
            <Logo size={76} animated />
          </div>
        </div>

        {/* Editorial typography & kinetic progress rule */}
        <div className="soukoul-splash-copy">
          <p className="soukoul-splash-kicker">DAKAR · CAMPUS UNIVERSITAIRE</p>
          <h1 className="serif soukoul-splash-title">Soukoul</h1>
          <div className="soukoul-splash-rule" aria-hidden>
            <span className="soukoul-splash-rule-bar" />
          </div>
          <p className="soukoul-splash-sub">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
