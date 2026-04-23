const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, Q }           = require('../models/db');
const { authMiddleware, adminMiddleware, JWT_SECRET } = require('../middleware/auth');

// ═══════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════
const authRouter = express.Router();

function safeUser(u) {
  return { id: u._id, name: u.name, username: u.username, phone: u.phone, email: u.email, referralCode: u.referralCode, isActive: u.isActive, vipLevel: u.vipLevel, balance: u.balance, role: u.role, avatar: u.avatar };
}

authRouter.post('/register', async (req, res) => {
  try {
    const { name, username, phone, email, password, referral } = req.body;
    if (!name || !username || !phone || !email || !password)
      return res.status(400).json({ message: 'সব তথ্য পূরণ করুন' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password কমপক্ষে ৬ অক্ষর হতে হবে' });
    if (!/^01[3-9]\d{8}$/.test(phone))
      return res.status(400).json({ message: 'সঠিক বাংলাদেশী ফোন নম্বর দিন' });
    if (await Q.findOne(db.users, { phone }))
      return res.status(409).json({ message: 'এই ফোন নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে' });
    if (await Q.findOne(db.users, { email }))
      return res.status(409).json({ message: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে' });
    if (await Q.findOne(db.users, { username: username.toLowerCase() }))
      return res.status(409).json({ message: 'এই username আগেই নেওয়া হয়েছে' });

    const hash    = bcrypt.hashSync(password, 10);
    const refCode = uuidv4().slice(0, 8).toUpperCase();
    let referredBy = null;
    if (referral) {
      const ref = await Q.findOne(db.users, { referralCode: referral.toUpperCase() });
      if (ref) referredBy = referral.toUpperCase();
    }
    const user = await Q.insert(db.users, {
      name, username: username.toLowerCase(), phone, email,
      password: hash, referralCode: refCode, referredBy,
      isActive: false, activationPending: false,
      vipLevel: 0, balance: 0, totalEarned: 0,
      role: 'user', avatar: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'ফোন নম্বর ও পাসওয়ার্ড দিন' });
    const user = await Q.findOne(db.users, { phone });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'ফোন নম্বর বা পাসওয়ার্ড ভুল' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  USER
// ═══════════════════════════════════════
const userRouter = express.Router();

userRouter.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user        = await Q.findOne(db.users, { _id: req.user._id });
    const today       = new Date(); today.setHours(0,0,0,0);
    const todayTx     = await Q.find(db.transactions, { userId: user._id, type: 'task', createdAt: { $gte: today } });
    const todayEarned = todayTx.reduce((s, t) => s + t.amount, 0);
    const team        = await Q.find(db.users, { referredBy: user.referralCode });
    const pending     = await Q.findOne(db.activations, { userId: user._id, status: 'pending' });
    res.json({ balance: user.balance, totalEarned: user.totalEarned, todayEarned, teamCount: team.length, vipLevel: user.vipLevel, isActive: user.isActive, activationPending: !!pending });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await Q.findOne(db.users, { _id: req.user._id });
    res.json({ balance: user.balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/profile', authMiddleware, async (req, res) => {
  try {
    const u = await Q.findOne(db.users, { _id: req.user._id });
    res.json({ id: u._id, name: u.name, username: u.username, phone: u.phone, email: u.email, avatar: u.avatar, referralCode: u.referralCode, isActive: u.isActive, vipLevel: u.vipLevel, balance: u.balance, totalEarned: u.totalEarned, createdAt: u.createdAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'Avatar দিন' });
    if (avatar.length > 700000) return res.status(400).json({ message: 'Image বড়। Max 500KB।' });
    await Q.update(db.users, { _id: req.user._id }, { $set: { avatar, updatedAt: new Date() } });
    res.json({ message: 'Avatar update হয়েছে' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/status', authMiddleware, async (req, res) => {
  try {
    const user    = await Q.findOne(db.users, { _id: req.user._id });
    const pending = await Q.findOne(db.activations, { userId: user._id, status: 'pending' });
    res.json({ isActive: user.isActive, activationPending: !!pending });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/vip', authMiddleware, async (req, res) => {
  try {
    const user = await Q.findOne(db.users, { _id: req.user._id });
    res.json({ vipLevel: user.vipLevel });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/history', authMiddleware, async (req, res) => {
  try {
    const txs = await Q.find(db.transactions, { userId: req.user._id }, { createdAt: -1 });
    const wds = await Q.find(db.withdrawals,  { userId: req.user._id }, { createdAt: -1 });
    const history = [
      ...txs.map(t => ({ id: t._id, type: t.type, amount: t.amount, description: t.description, status: t.status, createdAt: t.createdAt })),
      ...wds.map(w => ({ id: w._id, type: 'withdraw', amount: w.amount, description: `Withdrawal via ${w.method} to ${w.number}`, status: w.status, createdAt: w.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ history });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

userRouter.get('/team', authMiddleware, async (req, res) => {
  try {
    const user    = await Q.findOne(db.users, { _id: req.user._id });
    const members = await Q.find(db.users, { referredBy: user.referralCode }, { createdAt: -1 });
    const refs    = await Q.find(db.referrals, { referrerId: user._id });
    const commission = refs.reduce((s, r) => s + r.amount, 0);
    res.json({ total: members.length, active: members.filter(m => m.isActive).length, commission, members: members.map(m => ({ name: m.name, phone: m.phone.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2'), isActive: m.isActive, joinedAt: m.createdAt })) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  TAX (TASKS)
// ═══════════════════════════════════════
const taxRouter = express.Router();
const MAX_TASKS = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };

taxRouter.get('/today', authMiddleware, async (req, res) => {
  try {
    const user = await Q.findOne(db.users, { _id: req.user._id });
    if (!user.isActive) return res.json({ accountNotActive: true });
    const today      = new Date(); today.setHours(0,0,0,0);
    const maxTasks   = MAX_TASKS[user.vipLevel] || 1;
    const doneToday  = await Q.find(db.completions, { userId: user._id, completedAt: { $gte: today } });
    const earnedToday = doneToday.reduce((s, c) => s + c.earned, 0);
    if (doneToday.length >= maxTasks) return res.json({ allCompleted: true, maxTasks, completedToday: doneToday.length, earnedToday });
    const doneIds  = doneToday.map(c => c.taskId);
    const allTasks = await Q.find(db.tasks, { isActive: true });
    const available = allTasks.filter(t => !doneIds.includes(t._id));
    const task = available.length ? available[Math.floor(Math.random() * available.length)] : null;
    res.json({ task: task ? { _id: task._id, title: task.title, description: task.description, url: task.url, type: task.type, reward: task.reward, watchSeconds: task.watchSeconds || 60 } : null, maxTasks, completedToday: doneToday.length, earnedToday });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

taxRouter.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.body;
    const user = await Q.findOne(db.users, { _id: req.user._id });
    if (!user.isActive) return res.status(403).json({ message: 'Account active নয়' });
    const today     = new Date(); today.setHours(0,0,0,0);
    const maxTasks  = MAX_TASKS[user.vipLevel] || 1;
    const doneToday = await Q.find(db.completions, { userId: user._id, completedAt: { $gte: today } });
    if (doneToday.length >= maxTasks) return res.status(400).json({ message: 'আজকের task limit শেষ' });
    if (doneToday.find(c => c.taskId === taskId)) return res.status(400).json({ message: 'এই task আজ আগেই করা হয়েছে' });
    const task = await Q.findOne(db.tasks, { _id: taskId, isActive: true });
    if (!task) return res.status(404).json({ message: 'Task পাওয়া যায়নি' });
    await Q.insert(db.completions, { userId: user._id, taskId: task._id, earned: task.reward, completedAt: new Date() });
    await Q.update(db.users, { _id: user._id }, { $set: { balance: user.balance + task.reward, totalEarned: user.totalEarned + task.reward, updatedAt: new Date() } });
    await Q.insert(db.transactions, { userId: user._id, type: 'task', amount: task.reward, description: `Task: ${task.title}`, status: 'completed', createdAt: new Date() });
    res.json({ earned: task.reward, message: 'Task সম্পন্ন! টাকা যোগ হয়েছে।' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  ACTIVATION
// ═══════════════════════════════════════
const activationRouter = express.Router();

activationRouter.post('/submit', authMiddleware, async (req, res) => {
  try {
    const user = await Q.findOne(db.users, { _id: req.user._id });
    if (user.isActive) return res.status(400).json({ message: 'Account ইতিমধ্যে active আছে' });
    const pending = await Q.findOne(db.activations, { userId: user._id, status: 'pending' });
    if (pending) return res.status(400).json({ message: 'আপনার একটি pending request আছে' });
    const { paymentMethod, senderNumber, transactionId } = req.body;
    if (!paymentMethod || !senderNumber || !transactionId) return res.status(400).json({ message: 'সব তথ্য পূরণ করুন' });
    const txnUsed = await Q.findOne(db.activations, { transactionId });
    if (txnUsed) return res.status(400).json({ message: 'এই Transaction ID আগেই ব্যবহার হয়েছে' });
    await Q.insert(db.activations, { userId: user._id, paymentMethod, senderNumber, transactionId, amount: 100, status: 'pending', createdAt: new Date() });
    await Q.update(db.users, { _id: user._id }, { $set: { activationPending: true, updatedAt: new Date() } });
    res.json({ message: 'Request পাঠানো হয়েছে। ১০-১৫ মিনিটের মধ্যে activate হবে।' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  WITHDRAW
// ═══════════════════════════════════════
const withdrawRouter = express.Router();

withdrawRouter.post('/request', authMiddleware, async (req, res) => {
  try {
    const { method, number, amount } = req.body;
    const user   = await Q.findOne(db.users, { _id: req.user._id });
    if (!user.isActive) return res.status(403).json({ message: 'Account active নয়' });
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 300)  return res.status(400).json({ message: 'সর্বনিম্ন উত্তোলন ৳৩০০' });
    if (parsed > 1500)            return res.status(400).json({ message: 'সর্বোচ্চ উত্তোলন ৳১৫০০' });
    if (user.balance < parsed)    return res.status(400).json({ message: 'পর্যাপ্ত ব্যালেন্স নেই' });
    const pendingWd = await Q.findOne(db.withdrawals, { userId: user._id, status: 'pending' });
    if (pendingWd) return res.status(400).json({ message: 'একটি pending withdrawal আছে। সেটি সম্পন্ন হলে আবার চেষ্টা করুন।' });
    await Q.update(db.users, { _id: user._id }, { $set: { balance: user.balance - parsed, updatedAt: new Date() } });
    await Q.insert(db.withdrawals, { userId: user._id, method, number, amount: parsed, status: 'pending', createdAt: new Date() });
    await Q.insert(db.transactions, { userId: user._id, type: 'withdraw', amount: parsed, description: `Withdrawal via ${method} to ${number}`, status: 'pending', createdAt: new Date() });
    res.json({ message: 'Withdrawal request পাঠানো হয়েছে। ৫-৭ কার্যদিবসের মধ্যে পাবেন।' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  VIP
// ═══════════════════════════════════════
const vipRouter = express.Router();
const VIP_PRICES = { 1: 300, 2: 400, 3: 500, 4: 700 };

vipRouter.post('/purchase', authMiddleware, async (req, res) => {
  try {
    const { level, amount, paymentMethod, senderNumber, transactionId } = req.body;
    if (!level || !amount || !paymentMethod || !senderNumber || !transactionId) return res.status(400).json({ message: 'সব তথ্য পূরণ করুন' });
    const lvl = parseInt(level);
    if (!VIP_PRICES[lvl] || parseFloat(amount) !== VIP_PRICES[lvl]) return res.status(400).json({ message: 'VIP level বা amount ভুল' });
    const txnUsed = await Q.findOne(db.vipPurchases, { transactionId });
    if (txnUsed) return res.status(400).json({ message: 'এই Transaction ID আগেই ব্যবহার হয়েছে' });
    await Q.insert(db.vipPurchases, { userId: req.user._id, level: lvl, amount: VIP_PRICES[lvl], paymentMethod, senderNumber, transactionId, status: 'pending', createdAt: new Date() });
    res.json({ message: `VIP ${lvl} request পাঠানো হয়েছে। ১০-১৫ মিনিটের মধ্যে activate হবে।` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════
const adminRouter = express.Router();
const REFERRAL_COMMISSION = 50;

adminRouter.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers         = await Q.count(db.users, { role: 'user' });
    const activeUsers        = await Q.count(db.users, { role: 'user', isActive: true });
    const pendingActivations = await Q.count(db.activations, { status: 'pending' });
    const pendingWithdrawals = await Q.count(db.withdrawals,  { status: 'pending' });
    const pendingVip         = await Q.count(db.vipPurchases, { status: 'pending' });
    const allUsers           = await Q.find(db.users, { role: 'user' });
    const totalBalance       = allUsers.reduce((s, u) => s + u.balance, 0);
    const completedWds       = await Q.find(db.withdrawals, { status: 'completed' });
    const totalWithdrawn     = completedWds.reduce((s, w) => s + w.amount, 0);
    const totalTasks         = await Q.count(db.tasks, { isActive: true });
    res.json({ totalUsers, activeUsers, pendingActivations, pendingWithdrawals, pendingVip, totalBalance, totalWithdrawn, totalTasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { search = '' } = req.query;
    let users = await Q.find(db.users, { role: 'user' }, { createdAt: -1 });
    if (search) users = users.filter(u => u.name.includes(search) || u.phone.includes(search) || u.username.includes(search));
    res.json({ users, total: users.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/users/:id/toggle-active', adminMiddleware, async (req, res) => {
  try {
    const user = await Q.findOne(db.users, { _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User পাওয়া যায়নি' });
    await Q.update(db.users, { _id: user._id }, { $set: { isActive: !user.isActive, updatedAt: new Date() } });
    res.json({ message: `User ${!user.isActive ? 'activated' : 'deactivated'}`, isActive: !user.isActive });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/users/:id/balance', adminMiddleware, async (req, res) => {
  try {
    const { amount, type = 'add' } = req.body;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return res.status(400).json({ message: 'সঠিক amount দিন' });
    const user = await Q.findOne(db.users, { _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User পাওয়া যায়নি' });
    const newBal = type === 'add' ? user.balance + parsed : Math.max(0, user.balance - parsed);
    await Q.update(db.users, { _id: user._id }, { $set: { balance: newBal, updatedAt: new Date() } });
    await Q.insert(db.transactions, { userId: user._id, type: 'admin', amount: parsed, description: `Admin ${type}: ৳${parsed}`, status: 'completed', createdAt: new Date() });
    res.json({ message: `Balance ${type === 'add' ? 'added' : 'deducted'}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.get('/activations', adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const activations = await Q.find(db.activations, { status }, { createdAt: -1 });
    const result = await Promise.all(activations.map(async a => {
      const user = await Q.findOne(db.users, { _id: a.userId });
      return { ...a, name: user?.name, phone: user?.phone, username: user?.username };
    }));
    res.json({ activations: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/activations/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const activation = await Q.findOne(db.activations, { _id: req.params.id });
    if (!activation || activation.status !== 'pending') return res.status(400).json({ message: 'Invalid request' });
    await Q.update(db.users, { _id: activation.userId }, { $set: { isActive: true, activationPending: false, updatedAt: new Date() } });
    await Q.update(db.activations, { _id: activation._id }, { $set: { status: 'approved' } });
    const activatedUser = await Q.findOne(db.users, { _id: activation.userId });
    if (activatedUser.referredBy) {
      const referrer = await Q.findOne(db.users, { referralCode: activatedUser.referredBy });
      if (referrer) {
        await Q.update(db.users, { _id: referrer._id }, { $set: { balance: referrer.balance + REFERRAL_COMMISSION, totalEarned: referrer.totalEarned + REFERRAL_COMMISSION } });
        await Q.insert(db.referrals,    { referrerId: referrer._id, referredId: activatedUser._id, amount: REFERRAL_COMMISSION, createdAt: new Date() });
        await Q.insert(db.transactions, { userId: referrer._id, type: 'referral', amount: REFERRAL_COMMISSION, description: `Referral: ${activatedUser.name}`, status: 'completed', createdAt: new Date() });
      }
    }
    res.json({ message: 'Account activate হয়েছে। Referral commission দেওয়া হয়েছে।' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/activations/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { reason = 'Payment verify হয়নি' } = req.body;
    await Q.update(db.activations, { _id: req.params.id }, { $set: { status: 'rejected', adminNote: reason } });
    const activation = await Q.findOne(db.activations, { _id: req.params.id });
    if (activation) await Q.update(db.users, { _id: activation.userId }, { $set: { activationPending: false } });
    res.json({ message: 'Rejected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.get('/tasks', adminMiddleware, async (req, res) => {
  try {
    const tasks = await Q.find(db.tasks, {}, { createdAt: -1 });
    res.json({ tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.post('/tasks', adminMiddleware, async (req, res) => {
  try {
    const { title, description = '', url, type = 'website', reward, watchSeconds = 60 } = req.body;
    if (!title || !url || !reward) return res.status(400).json({ message: 'Title, URL ও reward দিন' });
    const task = await Q.insert(db.tasks, { title, description, url, type, reward: parseFloat(reward), watchSeconds: parseInt(watchSeconds), isActive: true, createdAt: new Date() });
    res.json({ message: 'Task তৈরি হয়েছে', id: task._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/tasks/:id', adminMiddleware, async (req, res) => {
  try {
    const { title, description = '', url, type, reward, watchSeconds, is_active } = req.body;
    await Q.update(db.tasks, { _id: req.params.id }, { $set: { title, description, url, type, reward: parseFloat(reward), watchSeconds: parseInt(watchSeconds), isActive: !!is_active } });
    res.json({ message: 'Task update হয়েছে' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.delete('/tasks/:id', adminMiddleware, async (req, res) => {
  try {
    await Q.remove(db.tasks, { _id: req.params.id });
    res.json({ message: 'Task delete হয়েছে' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.get('/withdrawals', adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const withdrawals = await Q.find(db.withdrawals, { status }, { createdAt: -1 });
    const result = await Promise.all(withdrawals.map(async w => {
      const user = await Q.findOne(db.users, { _id: w.userId });
      return { ...w, name: user?.name, phone: user?.phone };
    }));
    res.json({ withdrawals: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/withdrawals/:id/approve', adminMiddleware, async (req, res) => {
  try {
    await Q.update(db.withdrawals, { _id: req.params.id }, { $set: { status: 'completed', updatedAt: new Date() } });
    res.json({ message: 'Withdrawal approved - paid' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/withdrawals/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { reason = 'Rejected' } = req.body;
    const w = await Q.findOne(db.withdrawals, { _id: req.params.id });
    if (!w) return res.status(404).json({ message: 'পাওয়া যায়নি' });
    const user = await Q.findOne(db.users, { _id: w.userId });
    if (user) await Q.update(db.users, { _id: user._id }, { $set: { balance: user.balance + w.amount } });
    await Q.update(db.withdrawals, { _id: w._id }, { $set: { status: 'rejected', adminNote: reason } });
    res.json({ message: 'Rejected - balance refunded' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.get('/vip-purchases', adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const purchases = await Q.find(db.vipPurchases, { status }, { createdAt: -1 });
    const result = await Promise.all(purchases.map(async p => {
      const user = await Q.findOne(db.users, { _id: p.userId });
      return { ...p, name: user?.name, phone: user?.phone, currentVip: user?.vipLevel };
    }));
    res.json({ purchases: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/vip-purchases/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const vp   = await Q.findOne(db.vipPurchases, { _id: req.params.id });
    if (!vp || vp.status !== 'pending') return res.status(400).json({ message: 'Invalid' });
    const user = await Q.findOne(db.users, { _id: vp.userId });
    const newLevel = Math.max(user.vipLevel, vp.level);
    await Q.update(db.users, { _id: user._id }, { $set: { vipLevel: newLevel, updatedAt: new Date() } });
    await Q.update(db.vipPurchases, { _id: vp._id }, { $set: { status: 'approved' } });
    await Q.insert(db.transactions, { userId: user._id, type: 'vip', amount: vp.amount, description: `VIP ${vp.level} activated`, status: 'completed', createdAt: new Date() });
    res.json({ message: `VIP ${vp.level} activated` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

adminRouter.put('/vip-purchases/:id/reject', adminMiddleware, async (req, res) => {
  try {
    await Q.update(db.vipPurchases, { _id: req.params.id }, { $set: { status: 'rejected' } });
    res.json({ message: 'VIP rejected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = { authRouter, userRouter, taxRouter, activationRouter, withdrawRouter, vipRouter, adminRouter };
