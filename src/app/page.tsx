import Link from "next/link";

export default function Home() {
  return (
    <div className="site-shell">
      <header className="mx-auto flex w-full max-w-6xl items-center px-5 py-6 sm:px-8">
        <Link className="brand-mark" href="/" aria-label="PT Forge home">
          <span>PT</span> FORGE
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 place-items-center px-5 pb-16 pt-8 sm:px-8 sm:pb-24">
        <section className="max-w-3xl text-center">
          <p className="eyebrow">Built for BGMI organizers</p>
          <h1 className="mt-5 text-balance text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-7xl">
            Results in.
            <span className="block text-lime-300">Points table out.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Start a tournament in seconds. Your work stays saved on this device.
          </p>
          <Link className="primary-action mt-8" href="/tournaments/new">
            Create Points Table
            <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-4 text-sm text-slate-500">No sign in required</p>
        </section>
      </main>
    </div>
  );
}
