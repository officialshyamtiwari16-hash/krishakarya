export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const DAILY_LIMIT = 50;
  return res.status(200).json({
    remaining: DAILY_LIMIT,
    limit: DAILY_LIMIT,
    used: 0,
    resetAt: 'Midnight IST'
  });
}
