import type { NextApiRequest, NextApiResponse } from 'next'
import { users } from '../../app/auth/users'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  // Set cookies server-side
  res.setHeader('Set-Cookie', [
    `auth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`,
    `userRole=${user.role}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`,
    `username=${encodeURIComponent(user.username)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`
  ])
  res.status(200).json({ success: true })
} 