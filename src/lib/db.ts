// lib/db.ts
import { Pool } from '@neondatabase/serverless'
// import { neonConfig } from '@neondatabase/serverless'

// cache 連線以防每次都建立（Node.js 環境下建議）
// The `fetchConnectionCache` option is deprecated (now always `true`)
// neonConfig.fetchConnectionCache = true

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export default pool
