import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    )
  }

  const supabase = createBrowserClient(url, key, {
    cookieOptions: {
      domain:
        process.env.NEXT_PUBLIC_CO_DEV_ENV === 'preview'
          ? '.preview.co.dev'
          : undefined,
    },
  })

  return supabase
}