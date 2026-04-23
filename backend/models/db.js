// ===== DATABASE (NeDB - Pure JavaScript, no extra software needed) =====
const Datastore = require('@seald-io/nedb');
const bcrypt    = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = {
  users:        new Datastore({ filename: path.join(DATA_DIR, 'users.db'),        autoload: true }),
  activations:  new Datastore({ filename: path.join(DATA_DIR, 'activations.db'),  autoload: true }),
  tasks:        new Datastore({ filename: path.join(DATA_DIR, 'tasks.db'),        autoload: true }),
  completions:  new Datastore({ filename: path.join(DATA_DIR, 'completions.db'),  autoload: true }),
  transactions: new Datastore({ filename: path.join(DATA_DIR, 'transactions.db'), autoload: true }),
  withdrawals:  new Datastore({ filename: path.join(DATA_DIR, 'withdrawals.db'),  autoload: true }),
  vipPurchases: new Datastore({ filename: path.join(DATA_DIR, 'vip.db'),          autoload: true }),
  referrals:    new Datastore({ filename: path.join(DATA_DIR, 'referrals.db'),    autoload: true }),
};

// Indexes
db.users.ensureIndex({ fieldName: 'phone',        unique: true });
db.users.ensureIndex({ fieldName: 'username',     unique: true });
db.users.ensureIndex({ fieldName: 'email',        unique: true });
db.users.ensureIndex({ fieldName: 'referralCode', unique: true });

// Helpers
const Q = {
  findOne: (col, q)      => new Promise((res, rej) => col.findOne(q, (e, d) => e ? rej(e) : res(d))),
  find:    (col, q, s)   => new Promise((res, rej) => { let r = col.find(q); if (s) r = r.sort(s); r.exec((e, d) => e ? rej(e) : res(d || [])); }),
  insert:  (col, doc)    => new Promise((res, rej) => col.insert(doc, (e, d) => e ? rej(e) : res(d))),
  update:  (col, q, upd) => new Promise((res, rej) => col.update(q, upd, {}, (e) => e ? rej(e) : res())),
  remove:  (col, q)      => new Promise((res, rej) => col.remove(q, { multi: true }, (e) => e ? rej(e) : res())),
  count:   (col, q)      => new Promise((res, rej) => col.count(q, (e, n) => e ? rej(e) : res(n))),
};

// Seed admin
(async () => {
  try {
    const admin = await Q.findOne(db.users, { role: 'admin' });
    if (!admin) {
      const hash    = bcrypt.hashSync('admin123', 10);
      const refCode = 'ADMIN' + uuidv4().slice(0, 6).toUpperCase();
      await Q.insert(db.users, {
        name: 'Admin', username: 'admin',
        phone: '01718158600', email: 'admin@saturday.com',
        password: hash, referralCode: refCode,
        referredBy: null, isActive: true,
        activationPending: false, vipLevel: 0,
        balance: 0, totalEarned: 0,
        role: 'admin', avatar: null,
        createdAt: new Date(), updatedAt: new Date(),
      });
      console.log('✅ Admin ready → phone: 01718158600 | password: admin123');
    }
  } catch {}
})();

module.exports = { db, Q };
