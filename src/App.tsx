import { useEffect, useMemo, useRef, useState } from "react";
import { PunchGame } from "./game/PunchGame";
import { difficultyConfig, modes, rankFor } from "./game/config";
import type {
  CartoonStyle,
  Character,
  Difficulty,
  GameMode,
  Result,
  RoundStats,
} from "./types";
import { BrowserCartoonProvider, makeDefaultAvatar } from "./services/cartoon";
import {
  deleteAllData,
  getCharacter,
  getPreferences,
  highScore,
  removeCharacter,
  saveCharacter,
  saveHighScore,
  savePreferences,
  type Preferences,
} from "./services/storage";
import { deleteCharacterImage, saveCharacterImage } from "./services/imageDb";
import { accuracy, createLocalId, validateImage } from "./utils/game";
import {
  countdownSound,
  endSound,
  punchSound,
  startMusic,
  stopMusic,
} from "./services/audio";

type Screen =
  | "home"
  | "create"
  | "prepare"
  | "game"
  | "results"
  | "scores"
  | "help"
  | "settings";
const styles: { key: CartoonStyle; label: string; icon: string }[] = [
  { key: "classic", label: "Classic", icon: "✦" },
  { key: "comic", label: "Comic", icon: "💥" },
  { key: "bobble", label: "Bobble", icon: "◉" },
  { key: "pixel", label: "Retro", icon: "▦" },
  { key: "monster", label: "Monster", icon: "☻" },
];
const safeName = (s: string) =>
  s.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 18);

export default function App() {
  const [screen, setScreen] = useState<Screen>("home"),
    [character, setCharacter] = useState<Character | null>(() =>
      getCharacter(),
    ),
    [difficulty, setDifficulty] = useState<Difficulty>("medium"),
    [mode, setMode] = useState<GameMode>("classic"),
    [result, setResult] = useState<Result | null>(null),
    [prefs, setPrefs] = useState<Preferences>(() => getPreferences());
  const updatePrefs = (p: Preferences) => {
    setPrefs(p);
    savePreferences(p);
  };
  const beginCreate = () => setScreen("create");
  const deleteChar = async () => {
    if (character) await deleteCharacterImage(character.id);
    removeCharacter();
    setCharacter(null);
    setScreen("home");
  };
  const onFinish = (stats: RoundStats) => {
    const bestWas = highScore(mode, difficulty);
    const isPersonalBest = saveHighScore(mode, difficulty, stats.punches);
    const r: Result = {
      ...stats,
      accuracy: accuracy(stats),
      pps: +(stats.punches / stats.duration).toFixed(1),
      personalBest: Math.max(bestWas, stats.punches),
      isPersonalBest,
    };
    setResult(r);
    if (prefs.sound) endSound();
    setScreen("results");
  };
  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setScreen("home")}
          aria-label="PunchRush home"
        >
          <span>👊</span> PUNCH<span>RUSH</span>
        </button>
        <button
          className="sound-chip"
          onClick={() => updatePrefs({ ...prefs, sound: !prefs.sound })}
        >
          {prefs.sound ? "🔊 SFX" : "🔇 SFX"}
        </button>
      </header>
      {screen === "home" && (
        <Home
          character={character}
          onPlay={() => (character ? setScreen("prepare") : beginCreate())}
          go={setScreen}
        />
      )}
      {screen === "create" && (
        <Creator
          initial={character}
          onBack={() => setScreen("home")}
          onConfirm={async (c) => {
            saveCharacter(c);
            await saveCharacterImage(c.id, c.image);
            setCharacter(c);
            setScreen("prepare");
          }}
        />
      )}
      {screen === "prepare" && character && (
        <Prepare
          character={character}
          mode={mode}
          setMode={setMode}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={() => setScreen("game")}
          onChange={beginCreate}
        />
      )}
      {screen === "game" && character && (
        <GameScreen
          character={character}
          difficulty={difficulty}
          mode={mode}
          prefs={prefs}
          onFinish={onFinish}
          onQuit={() => setScreen("prepare")}
        />
      )}
      {screen === "results" && result && (
        <Results
          result={result}
          character={character!}
          onAgain={() => setScreen("prepare")}
          onChange={() => setScreen("create")}
          onHome={() => setScreen("home")}
        />
      )}
      {screen === "scores" && (
        <Scores mode={mode} setMode={setMode} go={setScreen} />
      )}
      {screen === "help" && <Help onBack={() => setScreen("home")} />}
      {screen === "settings" && (
        <Settings
          prefs={prefs}
          setPrefs={updatePrefs}
          onBack={() => setScreen("home")}
          onDelete={deleteChar}
          onWipe={() => {
            deleteAllData();
            setCharacter(null);
            setScreen("home");
          }}
        />
      )}
    </main>
  );
}

function Home({
  character,
  onPlay,
  go,
}: {
  character: Character | null;
  onPlay: () => void;
  go: (s: Screen) => void;
}) {
  return (
    <section className="home screen">
      <div className="burst burst-one">✦</div>
      <div className="burst burst-two">✹</div>
      <div className="hero-logo" aria-label="PunchRush">
        <span className="fist">👊</span>
        <div>PUNCH</div>
        <strong>RUSH</strong>
      </div>
      <p className="tagline">
        10 SECONDS. <em>MAXIMUM PUNCHES.</em>
      </p>
      <button className="primary play" onClick={onPlay}>
        {character ? "PLAY AGAIN" : "PLAY NOW"} <b>👊</b>
      </button>
      {character && (
        <p className="welcome">
          Ready, <strong>{character.nickname}</strong>?
        </p>
      )}
      <nav className="home-actions">
        <button onClick={() => go("scores")}>🏆 High Scores</button>
        <button onClick={() => go("help")}>❔ How to Play</button>
        <button onClick={() => go("settings")}>⚙️ Settings</button>
      </nav>
      <p className="privacy-mini">
        Photos stay on this device. Play nice, punch silly.
      </p>
    </section>
  );
}

function Creator({
  initial,
  onBack,
  onConfirm,
}: {
  initial: Character | null;
  onBack: () => void;
  onConfirm: (c: Character) => void;
}) {
  const [nickname, setNickname] = useState(initial?.nickname || ""),
    [raw, setRaw] = useState(initial?.image || makeDefaultAvatar("classic")),
    [preview, setPreview] = useState(
      initial?.image || makeDefaultAvatar("classic"),
    ),
    [style, setStyle] = useState<CartoonStyle>(initial?.style || "classic"),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1),
    [rotate, setRotate] = useState(0),
    [camera, setCamera] = useState<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => camera?.getTracks().forEach((t) => t.stop()), [camera]);
  const transform = async (source = raw, next = style) => {
    try {
      setPreview(await new BrowserCartoonProvider().transform(source, next));
    } catch {
      setPreview(makeDefaultAvatar(next));
      setError("We could not read that image, so a cartoon avatar was used.");
    }
  };
  const loadFile = (f?: File) => {
    if (!f) return;
    const e = validateImage(f);
    if (e) {
      setError(e);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const v = String(reader.result);
      setRaw(v);
      transform(v, style);
    };
    reader.readAsDataURL(f);
  };
  const takePhoto = () => {
    if (!video.current) return;
    const c = document.createElement("canvas");
    c.width = video.current.videoWidth;
    c.height = video.current.videoHeight;
    c.getContext("2d")!.drawImage(video.current, 0, 0);
    const v = c.toDataURL("image/jpeg", 0.9);
    setRaw(v);
    transform(v, style);
    camera?.getTracks().forEach((t) => t.stop());
    setCamera(null);
  };
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCamera(s);
      setTimeout(() => {
        if (video.current) video.current.srcObject = s;
      }, 0);
    } catch {
      setError("Camera access was unavailable. You can still upload a photo.");
    }
  };
  const showError = (message: string) => {
    setError(message);
    window.setTimeout(
      () =>
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      0,
    );
  };
  const save = () => {
    const name = safeName(nickname);
    if (!name) {
      showError("Give your challenger a nickname.");
      return;
    }
    try {
      onConfirm({
        id: initial?.id || createLocalId(),
        nickname: name,
        image: preview,
        style,
        createdAt: Date.now(),
      });
    } catch {
      showError("Your character could not be saved. Please try again.");
    }
  };
  return (
    <section className="screen creator">
      <button className="back" onClick={onBack}>
        ×
      </button>
      <h1>
        MAKE A <span>CHALLENGER</span>
      </h1>
      <p className="sub">Create a cartoon face, then let the chaos begin.</p>
      <div className="creator-grid">
        <div className="avatar-editor">
          <div className="avatar-ring">
            <img
              src={preview}
              style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
              alt="Cartoon character preview"
            />
          </div>
          <div className="adjust">
            <label>
              Zoom
              <input
                type="range"
                min="1"
                max="1.55"
                step=".05"
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
              />
            </label>
            <label>
              Rotate
              <input
                type="range"
                min="-30"
                max="30"
                value={rotate}
                onChange={(e) => setRotate(+e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="create-controls">
          <label className="field">
            Nickname
            <input
              value={nickname}
              maxLength={18}
              placeholder="e.g. Captain Tap"
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <div className="source-buttons">
            <button onClick={() => input.current?.click()}>
              🖼 Upload photo
            </button>
            <button onClick={startCamera}>📷 Camera</button>
            <button
              onClick={() => {
                const v = makeDefaultAvatar(style);
                setRaw(v);
                setPreview(v);
              }}
            >
              🎲 Default hero
            </button>
          </div>
          <input
            ref={input}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
          {camera && (
            <div className="camera">
              <video autoPlay muted playsInline ref={video} />
              <button className="primary" onClick={takePhoto}>
                SNAP!
              </button>
            </div>
          )}
          <h3>Pick a style</h3>
          <div className="style-row">
            {styles.map((s) => (
              <button
                className={style === s.key ? "selected" : ""}
                key={s.key}
                onClick={() => {
                  setStyle(s.key);
                  transform(raw, s.key);
                }}
              >
                <b>{s.icon}</b>
                {s.label}
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button className="primary" onClick={save}>
            READY TO RUMBLE 👊
          </button>
        </div>
      </div>
      <p className="privacy-note">
        Your image is processed in this browser and stored only on your device.
        PunchRush does not identify faces or upload photos.
      </p>
    </section>
  );
}

function Prepare({
  character,
  mode,
  setMode,
  difficulty,
  setDifficulty,
  onStart,
  onChange,
}: {
  character: Character;
  mode: GameMode;
  setMode: (m: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onChange: () => void;
}) {
  return (
    <section className="screen prepare">
      <h1>
        LOCKED. <span>LOADED.</span>
      </h1>
      <div className="ready-card">
        <div className="ready-avatar">
          <img src={character.image} />
          <i>👟</i>
          <i>👟</i>
        </div>
        <div>
          <p className="eyebrow">YOUR TARGET</p>
          <h2>{character.nickname}</h2>
          <p>
            Personal best: <b>{highScore(mode, difficulty)} punches</b>
          </p>
          <button className="text-button" onClick={onChange}>
            Change character
          </button>
        </div>
      </div>
      <h3>Game mode</h3>
      <div className="mode-grid">
        {(Object.keys(modes) as GameMode[]).map((m) => (
          <button
            key={m}
            className={mode === m ? "selected" : ""}
            onClick={() => setMode(m)}
          >
            <b>{modes[m].label}</b>
            <small>{modes[m].description}</small>
          </button>
        ))}
      </div>
      <h3>Choose the heat</h3>
      <div className="difficulty-row">
        {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
          <button
            key={d}
            className={difficulty === d ? "selected" : ""}
            style={
              { "--level": difficultyConfig[d].tint } as React.CSSProperties
            }
            onClick={() => setDifficulty(d)}
          >
            {difficultyConfig[d].label}
          </button>
        ))}
      </div>
      <button className="primary launch" onClick={onStart}>
        START PUNCHING <b>👊</b>
      </button>
    </section>
  );
}

function GameScreen({
  character,
  difficulty,
  mode,
  prefs,
  onFinish,
  onQuit,
}: {
  character: Character;
  difficulty: Difficulty;
  mode: GameMode;
  prefs: Preferences;
  onFinish: (s: RoundStats) => void;
  onQuit: () => void;
}) {
  const arena = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<RoundStats | null>(null),
    [time, setTime] = useState(modes[mode].duration),
    [count, setCount] = useState(3);
  useEffect(() => {
    if (!arena.current) return;
    if (prefs.music) startMusic(prefs.volume);
    const game = new PunchGame(arena.current, {
      character,
      difficulty,
      mode,
      callbacks: {
        onStats: (s, t) => {
          setStats({ ...s });
          setTime(t);
        },
        onCountdown: (n) => {
          setCount(n);
          if (prefs.sound && n >= 0) countdownSound(n === 0);
        },
        onImpact: () => {
          if (prefs.sound) punchSound();
          if (prefs.vibration) navigator.vibrate?.(12);
        },
        onFinish,
      },
    });
    return () => {
      game.destroy();
      stopMusic();
    };
  }, []);
  const urgent = time <= 3;
  return (
    <section className="game-screen">
      <div className="hud">
        <div className="hud-target">
          <small>FACE ONLY</small>
          <b>{character.nickname}</b>
        </div>
        <div className={"timer " + (urgent ? "urgent" : "")}>
          <small>TIME</small>
          <b>{time.toFixed(1)}</b>
        </div>
        <div className="hud-score">
          <b>{stats?.punches || 0}</b><small>PUNCHES · ×{stats?.combo || 0}</small>
        </div>
      </div>
      <div className="timer-bar">
        <i
          style={{
            width: `${Math.min(100, (time / modes[mode].duration) * 100)}%`,
          }}
        />
      </div>
      <div className="arena" ref={arena} />
      {count >= 0 && (
        <div className="count-label">{count === 0 ? "PUNCH!" : count}</div>
      )}
      <button className="quit" onClick={onQuit}>
        QUIT
      </button>
    </section>
  );
}

function Results({
  result,
  character,
  onAgain,
  onChange,
  onHome,
}: {
  result: Result;
  character: Character;
  onAgain: () => void;
  onChange: () => void;
  onHome: () => void;
}) {
  const rank = rankFor(result.punches);
  const shareText = `I landed ${result.punches} punches in ${result.duration} seconds on PunchRush! Can you beat ${rank}?`;
  const download = () => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 630;
    const x = c.getContext("2d")!;
    x.fillStyle = "#170a38";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#ffe63b";
    x.font = "900 90px Arial";
    x.fillText("PUNCHRUSH", 70, 120);
    x.fillStyle = "#ff7426";
    x.font = "900 155px Arial";
    x.fillText(`${result.punches} PUNCHES`, 70, 290);
    x.fillStyle = "#fff";
    x.font = "bold 45px Arial";
    x.fillText(
      `IN ${result.duration} SECONDS!   ${difficultyConfig[result.difficulty].label.toUpperCase()}`,
      75,
      365,
    );
    x.fillStyle = "#8cf168";
    x.fillText(`RANK: ${rank.toUpperCase()}`, 75, 455);
    x.fillStyle = "#fff";
    x.font = "35px Arial";
    x.fillText("Can you beat my score?", 75, 545);
    const a = document.createElement("a");
    a.download = "punchrush-score.png";
    a.href = c.toDataURL();
    a.click();
  };
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: "PunchRush",
          text: shareText,
          url: location.href,
        });
      else await navigator.clipboard.writeText(`${shareText} ${location.href}`);
    } catch {
      /* user dismissed */
    }
  };
  return (
    <section className="screen results">
      {result.isPersonalBest && (
        <div className="new-best">★ NEW PERSONAL BEST ★</div>
      )}
      <p className="eyebrow">{character.nickname.toUpperCase()} IS A</p>
      <h1>{rank.toUpperCase()}!</h1>
      <div className="result-score">
        {result.punches}
        <span>PUNCHES</span>
      </div>
      <p className="result-time">
        in {result.duration} seconds ·{" "}
        {difficultyConfig[result.difficulty].label}
      </p>
      <div className="stats-grid">
        <div>
          <b>{result.accuracy}%</b>
          <span>Accuracy</span>
        </div>
        <div>
          <b>{result.pps}</b>
          <span>Per second</span>
        </div>
        <div>
          <b>×{result.longestCombo}</b>
          <span>Best combo</span>
        </div>
        <div>
          <b>{result.misses}</b>
          <span>Misses</span>
        </div>
      </div>
      <button className="primary" onClick={onAgain}>
        PUNCH AGAIN 👊
      </button>
      <div className="result-actions">
        <button onClick={onChange}>Change character</button>
        <button onClick={share}>Share score</button>
        <button onClick={download}>Download card</button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(location.href);
          }}
        >
          Copy game link
        </button>
      </div>
      <button className="text-button" onClick={onHome}>
        Return home
      </button>
    </section>
  );
}

function Scores({
  mode,
  setMode,
  go,
}: {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  go: (s: Screen) => void;
}) {
  return (
    <section className="screen scores">
      <button className="back" onClick={() => go("home")}>
        ×
      </button>
      <h1>
        HALL OF <span>PUNCHES</span>
      </h1>
      <div className="mode-tabs">
        {(Object.keys(modes) as GameMode[]).map((m) => (
          <button
            className={m === mode ? "selected" : ""}
            onClick={() => setMode(m)}
            key={m}
          >
            {modes[m].label}
          </button>
        ))}
      </div>
      {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
        <div className="score-row" key={d}>
          <b style={{ color: difficultyConfig[d].tint }}>
            {difficultyConfig[d].label}
          </b>
          <strong>{highScore(mode, d)}</strong>
          <span>punches</span>
        </div>
      ))}
      <button className="primary" onClick={() => go("prepare")}>
        SET A SCORE
      </button>
    </section>
  );
}

function Help({ onBack }: { onBack: () => void }) {
  return (
    <section className="screen help">
      <button className="back" onClick={onBack}>
        ×
      </button>
      <h1>
        HOW TO <span>RUMBLE</span>
      </h1>
      <div className="help-card">
        <b>1. TAP THE TARGET</b>
        <p>Tap the bouncing cartoon as fast as your thumbs can go.</p>
        <b>2. STAY SHARP</b>
        <p>Every miss resets your combo. Hits build bonus arcade points.</p>
        <b>3. BEAT THE CLOCK</b>
        <p>
          Classic is exactly 10 seconds. Your actual punches are your score.
        </p>
      </div>
      <p className="privacy-note">
        Friendly cartoon chaos only: no photos leave your device by default.
      </p>
      <button className="primary" onClick={onBack}>
        GOT IT 👊
      </button>
    </section>
  );
}

function Settings({
  prefs,
  setPrefs,
  onBack,
  onDelete,
  onWipe,
}: {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  onBack: () => void;
  onDelete: () => void;
  onWipe: () => void;
}) {
  return (
    <section className="screen settings">
      <button className="back" onClick={onBack}>
        ×
      </button>
      <h1>
        GAME <span>SETTINGS</span>
      </h1>
      {(["sound", "music", "vibration"] as const).map((k) => (
        <label className="setting" key={k}>
          <span>
            {k === "sound"
              ? "Sound effects"
              : k === "music"
                ? "Arcade music"
                : "Vibration"}
          </span>
          <input
            type="checkbox"
            checked={prefs[k]}
            onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
          />
        </label>
      ))}
      <label className="setting volume">
        <span>Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step=".1"
          value={prefs.volume}
          onChange={(e) => setPrefs({ ...prefs, volume: +e.target.value })}
        />
      </label>
      <div className="danger">
        <button onClick={onDelete}>Delete character</button>
        <button onClick={onWipe}>Delete all local data</button>
      </div>
      <p className="privacy-note">
        PunchRush stores scores and your avatar locally. There are no accounts,
        ads, analytics, or image uploads.
      </p>
    </section>
  );
}
