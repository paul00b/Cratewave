/**
 * Vercel serverless proxy for the Gemini API.
 * The API key lives server-side (GEMINI_API_KEY env var) and is never exposed to the browser.
 *
 * Client POSTs a body equivalent to Gemini's generateContent payload and receives
 * the response stripped of any key material.
 */

export const config = { runtime: 'edge' }

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()

  const upstream = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const responseBody = await upstream.text()
  return new Response(responseBody, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
