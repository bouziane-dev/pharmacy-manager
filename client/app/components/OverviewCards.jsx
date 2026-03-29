'use client'

export default function OverviewCards({ stats }) {
  const tones = [
    'border-emerald-200/70 bg-[linear-gradient(140deg,rgba(236,253,245,0.9),rgba(255,255,255,0.95))] dark:border-emerald-500/35 dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.36),rgba(15,23,42,0.8))]',
    'border-sky-200/70 bg-[linear-gradient(140deg,rgba(224,242,254,0.9),rgba(255,255,255,0.95))] dark:border-sky-500/35 dark:bg-[linear-gradient(145deg,rgba(3,105,161,0.34),rgba(15,23,42,0.8))]',
    'border-violet-200/70 bg-[linear-gradient(140deg,rgba(243,232,255,0.82),rgba(255,255,255,0.95))] dark:border-violet-500/35 dark:bg-[linear-gradient(145deg,rgba(91,33,182,0.26),rgba(15,23,42,0.8))]',
    'border-amber-200/70 bg-[linear-gradient(140deg,rgba(254,243,199,0.78),rgba(255,255,255,0.95))] dark:border-amber-500/35 dark:bg-[linear-gradient(145deg,rgba(161,98,7,0.26),rgba(15,23,42,0.8))]'
  ]

  return (
    <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map((item, index) => (
        <article
          key={item.id}
          className={`panel border p-4 md:p-5 ${tones[index % tones.length]}`}
        >
          <p className='text-sm font-medium text-[var(--muted)]'>{item.label}</p>
          <p className='mt-2 text-3xl font-semibold text-[var(--foreground)]'>
            {item.value}
          </p>
          <p className='mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
            {item.delta}
          </p>
        </article>
      ))}
    </section>
  )
}
