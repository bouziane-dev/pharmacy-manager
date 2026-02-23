'use client'

export default function OverviewCards({ stats }) {
  return (
    <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map(item => (
        <article
          key={item.id}
          className='panel p-4 md:p-5'
        >
          <p className='text-sm text-[var(--muted)]'>{item.label}</p>
          <p className='mt-2 text-3xl font-semibold text-[var(--foreground)]'>
            {item.value}
          </p>
          <p className='mt-1 text-xs text-emerald-600 dark:text-emerald-400'>
            {item.delta}
          </p>
        </article>
      ))}
    </section>
  )
}
