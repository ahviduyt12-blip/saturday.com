# 🌟 Saturday Platform

## VPS এ Deploy করার নিয়ম

### Step 1 — ফাইল Upload করো
WinSCP দিয়ে সব ফাইল VPS এ upload করো:
```
/var/www/saturday/
```

### Step 2 — Node.js Install করো (VPS এ)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y
```

### Step 3 — Packages Install করো
```bash
cd /var/www/saturday/backend
npm install
```

### Step 4 — PM2 দিয়ে চালাও (সবসময় চালু থাকবে)
```bash
npm install -g pm2
pm2 start server.js --name saturday
pm2 startup
pm2 save
```

### Step 5 — Website চেক করো
```
http://তোমার-VPS-IP:3000
```

## Admin Login
- Phone: 01718158600
- Password: admin123
- Admin Panel: /admin/

## ফাইল Structure
```
saturday/
├── backend/          ← Node.js server
│   ├── server.js     ← Main file
│   ├── package.json  ← Dependencies
│   ├── models/db.js  ← Database
│   ├── middleware/   ← Auth
│   └── routes/       ← API routes
├── frontend/         ← Website pages
├── admin/            ← Admin panel
└── data/             ← Auto-created (database files)
```
