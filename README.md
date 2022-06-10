# google oauth credentials
cat credentials.json | wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env=production