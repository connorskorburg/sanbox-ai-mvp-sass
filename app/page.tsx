import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function checkSupabase() {
  try {
    const supabase = await createClient()
    await supabase.auth.getSession()
    return { status: 'connected', error: null }
  } catch (error) {
    return { status: 'error', error: String(error) }
  }
}

async function checkOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    return {
      status: response.ok ? 'connected' : 'error',
      error: response.ok ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    return { status: 'error', error: String(error) }
  }
}

async function checkStripe() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    await stripe.balance.retrieve()
    return { status: 'connected', error: null }
  } catch (error) {
    return { status: 'error', error: String(error) }
  }
}

function checkPostHog() {
  const hasKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
  const hasHost = !!process.env.NEXT_PUBLIC_POSTHOG_HOST
  return {
    status: hasKey && hasHost ? 'connected' : 'error',
    error: !hasKey || !hasHost ? 'Missing env vars' : null,
  }
}

export default async function Home() {
  const [supabase, openai, stripe, posthog] = await Promise.all([
    checkSupabase(),
    checkOpenAI(),
    checkStripe(),
    Promise.resolve(checkPostHog()),
  ])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          AI SaaS MVP Status
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <ServiceStatus name="Supabase" {...supabase} />
          <ServiceStatus name="OpenAI" {...openai} />
          <ServiceStatus name="Stripe" {...stripe} />
          <ServiceStatus name="PostHog" {...posthog} />
        </div>
      </div>
    </div>
  )
}

function ServiceStatus({
  name,
  status,
  error,
}: {
  name: string
  status: string
  error: string | null
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded">
      <span className="font-semibold">{name}</span>
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            status === 'connected'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
        {error && <span className="text-sm text-gray-500">{error}</span>}
      </div>
    </div>
  )
}
