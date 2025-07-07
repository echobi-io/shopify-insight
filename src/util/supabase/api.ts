import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import { type NextApiRequest, type NextApiResponse } from 'next'

export function createClient(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    )
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] || '' }))
        },
        setAll(cookiesToSet) {
          res.setHeader(
            'Set-Cookie',
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          )
        },
      },
      cookieOptions: {
        domain: process.env.NEXT_PUBLIC_CO_DEV_ENV === "preview" ? ".preview.co.dev" : undefined,
      }
    }
  )

  return supabase
}