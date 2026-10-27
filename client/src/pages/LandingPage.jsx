import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Boondocks landing page                                              */
/* Tailwind (arbitrary values, no config needed). Routes assumed:      */
/*   /signup (seeker)   /host-signup (host)   /login                   */
/* ------------------------------------------------------------------ */

const FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' };
const FOCUS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#FFFDD0]";

/* Hard-shadow button that presses into its shadow */
function BlockButton({ to, variant = "crimson", children }) {
  const styles =
    variant === "crimson"
      ? "bg-[#DC143C] text-[#FFFDD0] border-[#FFFDD0] shadow-[6px_6px_0_#FFFDD0] hover:bg-[#8B0000]"
      : "bg-[#FFFDD0] text-black border-[#DC143C] shadow-[6px_6px_0_#DC143C] hover:bg-[#F5F5DC]";
  return (
    <Link
      to={to}
      className={`inline-block border-[3px] px-7 py-4 text-lg font-bold uppercase tracking-wide transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_currentColor] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${styles} ${FOCUS}`}
    >
      {children}
    </Link>
  );
}

/* ---------------------------- Nav ---------------------------------- */
function Nav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link to="/" className={`text-3xl font-bold uppercase tracking-wider text-[#DC143C] sm:text-4xl ${FOCUS}`}>
        Boondocks
      </Link>
      <nav className="flex items-center gap-4 text-sm font-bold uppercase sm:gap-7">
        <a href="#engine" className={`hidden hover:text-[#DC143C] sm:inline ${FOCUS}`}>
          How it works
        </a>
        <a href="#rules" className={`hidden hover:text-[#DC143C] sm:inline ${FOCUS}`}>
          What's allowed
        </a>
        <Link
          to="/login"
          className={`border-2 border-[#DC143C] px-4 py-2 shadow-[4px_4px_0_#FFFDD0] hover:bg-[#DC143C] ${FOCUS}`}
        >
          Log in
        </Link>
      </nav>
    </header>
  );
}

/* ----------------------- Hero polaroid cards ------------------------ */
function ProfileCards() {
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[420px] select-none" aria-hidden="true">
      {/* host card, behind */}
      <div className="absolute right-0 top-10 w-[240px] rotate-[5deg] border-[3px] border-black bg-[#DC143C] p-3 shadow-[8px_8px_0_#FFFDD0]">
        <span className="absolute -top-4 right-3 border-2 border-black bg-[#FFFDD0] px-2 py-0.5 text-xs font-bold uppercase text-black">
          Host
        </span>
        <div className="grid h-44 place-items-center border-2 border-black bg-[#FFFDD0] text-8xl font-bold text-black">
          T
        </div>
        <p className="mt-3 text-center text-2xl font-bold text-[#FFFDD0]">Tanvi, 28</p>
        <p className="text-center text-xs font-bold uppercase text-[#FFFDD0]">
          Sharing flat, Andheri West. Makes insane pasta
        </p>
      </div>

      {/* seeker card, front */}
      <div className="absolute left-0 top-0 w-[250px] -rotate-[5deg] border-[3px] border-black bg-[#FFFDD0] p-3 shadow-[8px_8px_0_#DC143C]">
        <span className="absolute -top-4 right-3 border-2 border-black bg-black px-2 py-0.5 text-xs font-bold uppercase text-[#FFFDD0]">
          Seeker
        </span>
        <div className="grid h-44 place-items-center border-2 border-black bg-white text-8xl font-bold text-[#DC143C]">
          M
        </div>
        <p className="mt-3 text-center text-2xl font-bold text-[#DC143C]">Maya, 26</p>
        <p className="text-center text-xs font-bold uppercase text-black">Plants, punk &amp; good coffee</p>
        <div className="mt-3 flex items-center justify-between border-t-[3px] border-black pt-2">
          <span className="text-sm font-bold uppercase text-[#DC143C]">92% match</span>
          <span className="grid h-7 w-7 place-items-center border-2 border-black bg-[#DC143C] font-bold text-[#FFFDD0]">
            +
          </span>
        </div>
      </div>

      <span className="absolute bottom-6 left-6 -rotate-6 text-3xl font-bold text-[#DC143C] [text-shadow:2px_2px_0_#000]">
        This one!
      </span>
    </div>
  );
}

/* ----------------------------- Hero -------------------------------- */
function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <p className="mb-3 text-sm font-bold uppercase text-[#DC143C]">Roommates, without the weird part.</p>

        <h1
          className="font-bold uppercase leading-[0.9] tracking-tight text-[#FFFDD0]"
          style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}
        >
          Stop living
          <br />
          with
          <br />
          <span className="text-[#DC143C]">terrible</span>
          <br />
          roommates.
        </h1>

        <p
          className="mt-6 inline-block -rotate-1 border-[3px] border-[#DC143C] bg-[#FFFDD0] px-4 py-2 text-xl font-bold text-black shadow-[6px_6px_0_#DC143C] sm:text-2xl"
        >
          Match by compatibility, not just rent.
        </p>

        {/* Exclusivity callout */}
        <div className="mt-8 max-w-xl border-4 border-[#DC143C] bg-black p-4 shadow-[8px_8px_0_#8B0000]">
          <p className="text-base font-bold leading-snug sm:text-lg">
            <span className="bg-[#DC143C] px-2 text-[#FFFDD0]">EXCLUSIVELY</span> for Sharing PGs &amp; Sharing
            Flats. No full house rentals or house buying allowed here.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-6">
          <BlockButton to="/signup" variant="crimson">
            Find a Roommate
          </BlockButton>
          <BlockButton to="/host-signup" variant="cream">
            Host a Sharing Space
          </BlockButton>
        </div>
      </div>

      <ProfileCards />
    </section>
  );
}

/* ------------------- Weighted matching engine ----------------------- */
const DEMO_ROWS = [
  { factor: "Food", weight: 5, fit: 100, note: "Both veg" },
  { factor: "Vices", weight: 4, fit: 67, note: "You smoke, this flat does not allow it" },
  { factor: "Pets", weight: 2, fit: 100, note: "No pets either side" },
  { factor: "Guests", weight: 3, fit: 67, note: "Sometimes vs rarely" },
  { factor: "Sleep time", weight: 5, fit: 100, note: "Both early" },
];

const STEPS = [
  {
    title: "Say what you can't compromise on",
    body: "Food, alcohol, smoking, drugs, pets, guests and sleep time. Answer once, honestly.",
  },
  {
    title: "Give each habit a weight from 1 to 5",
    body: "A 5 is a dealbreaker. A 1 is whatever. A snorer is fine. A 2 a.m. party is not.",
  },
  {
    title: "We score every bed near you",
    body: "Each space gets a match percentage. Highest first. Rent is shown, but it never decides the order.",
  },
];

function Engine() {
  return (
    <section id="engine" className="border-y-4 border-[#DC143C] bg-[#DC143C] text-[#FFFDD0]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2
          className="font-bold uppercase leading-[0.95]"
          style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)" }}
        >
          Your rules.
          <br />
          Your weights.
          <br />
          Your score.
        </h2>
        <p className="mt-4 max-w-xl text-lg font-bold">
          The Weighted Matching Engine ranks sharing spaces by how well they fit how you actually live.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {/* steps: a real sequence, so numbered */}
          <ol className="space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 border-4 border-black bg-black p-4 shadow-[6px_6px_0_#FFFDD0]">
                <span className="text-5xl font-bold leading-none text-[#DC143C]">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-1 text-base">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* worked example */}
          <div className="border-4 border-black bg-[#FFFDD0] p-5 text-black shadow-[8px_8px_0_#000]">
            <h3 className="text-xl font-bold">Maya vs. a flat in Andheri West</h3>
            <ul className="mt-4 space-y-3">
              {DEMO_ROWS.map((r) => (
                <li key={r.factor}>
                  <div className="flex items-baseline justify-between text-sm font-bold">
                    <span>
                      {r.factor} <span className="text-[#8B0000]">(weight {r.weight})</span>
                    </span>
                    <span>{r.fit}% fit</span>
                  </div>
                  <div className="mt-1 h-4 border-2 border-black bg-white">
                    <div className="h-full bg-[#DC143C]" style={{ width: `${r.fit}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs">{r.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t-4 border-black pt-3 text-sm font-bold">
              Score = sum of (weight x fit) divided by sum of weights
            </p>
            <p className="text-5xl font-bold text-[#DC143C]">88% match</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Rules block ---------------------------- */
function Rules() {
  const yes = ["Sharing PGs", "Sharing flats", "Beds in a room you split with others"];
  const no = ["Full house or full flat rentals", "Buying a house", "Anything you'd have to live in alone"];
  return (
    <section id="rules" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="font-bold uppercase leading-none" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
        One kind of place. <span className="text-[#DC143C]">That's it.</span>
      </h2>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="border-4 border-[#FFFDD0] p-5 shadow-[8px_8px_0_#FFFDD0]">
          <h3 className="text-2xl font-bold">On Boondocks</h3>
          <ul className="mt-3 space-y-2 text-lg">
            {yes.map((t) => (
              <li key={t}>+ {t}</li>
            ))}
          </ul>
        </div>
        <div className="border-4 border-[#DC143C] p-5 shadow-[8px_8px_0_#DC143C]">
          <h3 className="text-2xl font-bold text-[#DC143C]">Not here</h3>
          <ul className="mt-3 space-y-2 text-lg line-through decoration-[#DC143C] decoration-[3px]">
            {no.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Footer ------------------------------- */
function FinalCta() {
  return (
    <section className="border-t-4 border-[#DC143C] px-5 py-16 text-center">
      <h2 className="font-bold uppercase leading-none" style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}>
        Find your people.
        <br />
        Then find the bed.
      </h2>
      <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-6">
        <BlockButton to="/signup" variant="crimson">
          Find a Roommate
        </BlockButton>
        <BlockButton to="/host-signup" variant="cream">
          Host a Sharing Space
        </BlockButton>
      </div>
      <p className="mt-12 text-sm text-[#F5F5DC]">Boondocks. Sharing PGs and sharing flats only.</p>
    </section>
  );
}

/* ------------------------------ Page -------------------------------- */
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-[#FFFDD0]" style={FONT}>
      <main>
        <Hero />
        <Engine />
        <Rules />
        <FinalCta />
      </main>
    </div>
  );
}