'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function UptimeCounter() {
  const { data, error } = useSWR('/api/status', fetcher, {
    refreshInterval: 1000,
  })

  if (error) return <div>Failed to load uptime</div>
  if (!data) return <div>Loading...</div>

  return (
    <div className="font-bold p-2 bg-[#c0c0c0]">
      <pre className="whitespace-pre-wrap">
        {`System Name: ${data.system}`}<br/>
        <div className="flex items-center gap-2">
          {`Monster Energy Drinks chugged (lifetime): ${data.monster_drinks_chugged}`}
            <img 
                src="/win98/monster-logo.webp" 
                alt="Monster Energy"
                className="w-4 h-8" 
            />
        </div>
      </pre>
    </div>
  )
}
