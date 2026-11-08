const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('node:fs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/requireAuth');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 5000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const storageDirectory = path.join(__dirname, 'data');
const storagePath = path.join(storageDirectory, 'mail-queue.json');
const allowedOrigins = ['https://multi-mail-mern.vercel.app', 'http://localhost:5173'];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', authRoutes);
app.use(requireAuth);

fs.mkdirSync(storageDirectory, { recursive: true });
let persistedMessages = { scheduled: [], sent: [] };
if (fs.existsSync(storagePath)) {
  persistedMessages = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
}

let hasUpdatedQueue = false;
for (const scheduledMessage of persistedMessages.scheduled) {
  if (scheduledMessage.status === 'sending') {
    scheduledMessage.status = 'pending';
    hasUpdatedQueue = true;
  }
  scheduledMessage.sentRecipients ||= [];
  if (
    scheduledMessage.status === 'pending' &&
    (!scheduledMessage.ownerUserId ||
      !scheduledMessage.senderEmail ||
      !scheduledMessage.smtpSessionId)
  ) {
    scheduledMessage.status = 'failed';
    scheduledMessage.failedRecipients = [...scheduledMessage.recipients];
    scheduledMessage.error =
      'This schedule has no active SMTP session and cannot be sent safely.';
    hasUpdatedQueue = true;
  }
}

const persistMessages = () => {
  const temporaryPath = `${storagePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(persistedMessages, null, 2));
  fs.renameSync(temporaryPath, storagePath);
};

if (hasUpdatedQueue) persistMessages();

const smtpSessions = new Map();
const clearSmtpSession = (sessionId) => {
  const session = smtpSessions.get(sessionId);
  if (session?.cleanupTimer) clearTimeout(session.cleanupTimer);
  smtpSessions.delete(sessionId);
};
const hasPendingScheduledMessages = (sessionId) =>
  persistedMessages.scheduled.some(
    (record) =>
      record.smtpSessionId === sessionId &&
      (record.status === 'pending' || record.status === 'sending'),
  );
const latestScheduledDelivery = (sessionId) =>
  persistedMessages.scheduled
    .filter(
      (record) =>
        record.smtpSessionId === sessionId &&
        (record.status === 'pending' || record.status === 'sending'),
    )
    .reduce(
      (latest, record) => Math.max(latest, new Date(record.scheduledAt).getTime()),
      Date.now(),
    );
const expireSmtpSession = (sessionId, expiresAt) => {
  const session = smtpSessions.get(sessionId);
  if (!session) return;
  if (session.cleanupTimer) clearTimeout(session.cleanupTimer);
  const delay = Math.min(Math.max(0, expiresAt - Date.now()), 2_147_000_000);
  session.cleanupTimer = setTimeout(() => {
    if (session.logoutRequested && !hasPendingScheduledMessages(sessionId)) {
      clearSmtpSession(sessionId);
    } else if (Date.now() >= expiresAt) {
      clearSmtpSession(sessionId);
    } else {
      expireSmtpSession(sessionId, expiresAt);
    }
  }, delay);
  session.cleanupTimer.unref?.();
};
const refreshSmtpSessionExpiry = (sessionId) => {
  if (!smtpSessions.has(sessionId)) return;
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  expireSmtpSession(
    sessionId,
    Math.max(sevenDaysFromNow, latestScheduledDelivery(sessionId) + 60 * 60 * 1000),
  );
};

const validateMessage = (body) => {
  const { recipients, subject, message } = body ?? {};
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return 'At least one recipient is required.';
  }
  if (body?.confirmedOptIn !== true) {
    return 'Confirm that the recipients agreed to receive this email before sending.';
  }
  if (
    recipients.some(
      (recipient) =>
        typeof recipient !== 'string' ||
        recipient.length > 254 ||
        !emailPattern.test(recipient.trim()),
    )
  ) {
    return 'One or more recipient email addresses are invalid.';
  }
  if (typeof subject !== 'string' || subject.length > 250 || /[\r\n]/.test(subject)) {
    return 'Subject must be text no longer than 250 characters.';
  }
  if (typeof message !== 'string' || message.length > 50000) {
    return 'Message must be text no longer than 50,000 characters.';
  }
  return null;
};

const uniqueRecipients = (recipients) => [
  ...new Set(recipients.map((recipient) => recipient.trim().toLowerCase())),
];

const createSentMessage = (record, recipient) => ({
  id: randomUUID(),
  ownerUserId: record.ownerUserId,
  recipient,
  senderName: record.senderName,
  senderEmail: record.senderEmail,
  subject: record.subject,
  snippet: record.message.slice(0, 80) || '(No message content)',
  message: record.message,
  timestamp: new Date().toLocaleString(),
  isStarred: false,
});

const deliverMessage = async (record) => {
  const smtpSession = smtpSessions.get(record.smtpSessionId);
  if (!smtpSession) {
    throw new Error('SMTP session is unavailable. Sign in and enter your app password again.');
  }

  record.status = 'sending';
  record.sentRecipients ||= [];
  persistMessages();
  const failedRecipients = [];
  const sentMessages = [];

  for (const recipient of record.recipients) {
    if (record.sentRecipients.includes(recipient)) continue;

    try {
      await smtpSession.transporter.sendMail({
        from: { name: record.senderName, address: smtpSession.smtpUser },
        to: recipient,
        subject: record.subject,
        text: record.message,
      });
      const sentMessage = createSentMessage(record, recipient);
      sentMessages.push(sentMessage);
      persistedMessages.sent.unshift(sentMessage);
      record.sentRecipients.push(recipient);
      persistMessages();
    } catch (error) {
      console.error(
        'Unable to deliver email to one recipient:',
        error.code || error.name || 'SMTP error',
      );
      failedRecipients.push(recipient);
    }
  }

  record.failedRecipients = failedRecipients;
  record.status =
    failedRecipients.length === 0
      ? 'sent'
      : failedRecipients.length === record.recipients.length
        ? 'failed'
        : 'partial';
  record.completedAt = new Date().toISOString();
  persistMessages();
  if (
    smtpSession.logoutRequested &&
    !hasPendingScheduledMessages(record.smtpSessionId)
  ) {
    clearSmtpSession(record.smtpSessionId);
  }
  return {
    sentRecipients: record.sentRecipients,
    failedRecipients,
    sentMessages,
  };
};

let scheduleTimer;
const scheduleNextDelivery = () => {
  clearTimeout(scheduleTimer);
  const nextMessage = persistedMessages.scheduled
    .filter((record) => record.status === 'pending')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

  if (!nextMessage) return;

  const delay = Math.max(0, new Date(nextMessage.scheduledAt).getTime() - Date.now());
  scheduleTimer = setTimeout(async () => {
    const dueMessages = persistedMessages.scheduled
      .filter(
        (record) =>
          record.status === 'pending' &&
          new Date(record.scheduledAt).getTime() <= Date.now(),
      )
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    for (const record of dueMessages) {
      try {
        await deliverMessage(record);
      } catch (error) {
        record.status = 'failed';
        record.failedRecipients = [...record.recipients];
        record.completedAt = new Date().toISOString();
        record.error = error.message;
        persistMessages();
        console.error('Scheduled message could not be sent:', error.message);
      }
    }

    scheduleNextDelivery();
  }, Math.min(delay, 2_147_000_000));
};

const messageSummary = (record) => ({
  id: record.id,
  recipient: record.recipients.join(', '),
  recipients: record.recipients,
  subject: record.subject,
  snippet: record.message.slice(0, 80) || '(No message content)',
  message: record.message,
  timestamp: record.status === 'pending'
    ? `Scheduled: ${new Date(record.scheduledAt).toLocaleString()}`
    : `${record.status}: ${new Date(record.scheduledAt).toLocaleString()}`,
  scheduledAt: record.scheduledAt,
  status: record.status,
  isStarred: Boolean(record.isStarred),
});

app.get('/messages', (req, res) => {
  res.json({
    scheduledMessages: persistedMessages.scheduled
      .filter((record) => record.status !== 'sent' && record.ownerUserId === req.user.userId)
      .map(messageSummary),
    sentMessages: persistedMessages.sent.filter(
      (record) => record.ownerUserId === req.user.userId,
    ),
  });
});

app.post('/smtp/session', async (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || password.length === 0 || password.length > 1024) {
    return res.status(400).json({ error: 'Enter a valid SMTP app password.' });
  }

  const SMTP_USER = req.user.email;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: password },
  });

  try {
    await transporter.verify();
  } catch (error) {
    console.error('SMTP credential verification failed:', error.code || error.name);
    return res.status(400).json({
      error: 'Could not verify the Gmail app password for this account.',
    });
  }

  const existingSession = smtpSessions.get(req.user.sessionId);
  if (existingSession?.cleanupTimer) clearTimeout(existingSession.cleanupTimer);
  smtpSessions.set(req.user.sessionId, {
    smtpUser: SMTP_USER,
    transporter,
    logoutRequested: false,
    cleanupTimer: null,
  });
  expireSmtpSession(req.user.sessionId, Date.now() + 7 * 24 * 60 * 60 * 1000);
  return res.json({ configured: true, email: SMTP_USER });
});

app.post('/logout', (req, res) => {
  requireAuth.revokeSession(req.user.sessionId, req.user.tokenExpiration);

  const session = smtpSessions.get(req.user.sessionId);
  if (session && hasPendingScheduledMessages(req.user.sessionId)) {
    session.logoutRequested = true;
    expireSmtpSession(req.user.sessionId, latestScheduledDelivery(req.user.sessionId) + 60 * 60 * 1000);
  } else {
    clearSmtpSession(req.user.sessionId);
  }

  return res.json({ loggedOut: true });
});

app.patch('/messages/:id/star', (req, res) => {
  if (typeof req.body?.isStarred !== 'boolean') {
    return res.status(400).json({ error: 'isStarred must be true or false.' });
  }

  const record = [
    ...persistedMessages.sent,
    ...persistedMessages.scheduled,
  ].find((message) => message.id === req.params.id && message.ownerUserId === req.user.userId);

  if (!record) return res.status(404).json({ error: 'Message was not found.' });
  record.isStarred = req.body.isStarred;
  persistMessages();
  return res.json({ id: record.id, isStarred: record.isStarred });
});

app.post('/send', async (req, res) => {
  const validationError = validateMessage(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!smtpSessions.has(req.user.sessionId)) {
    return res.status(428).json({ error: 'Enter and verify your SMTP app password before sending.' });
  }

  const record = {
    id: randomUUID(),
    recipients: uniqueRecipients(req.body.recipients),
    subject: req.body.subject.trim() || '(No subject)',
    message: req.body.message,
    ownerUserId: req.user.userId,
    senderName: req.user.name,
    senderEmail: req.user.email,
    smtpSessionId: req.user.sessionId,
    status: 'pending',
  };

  try {
    const result = await deliverMessage(record);
    const response = {
      ...result,
      message: `Message sent to ${result.sentRecipients.length} recipient(s).`,
    };
    return res.status(result.failedRecipients.length > 0 ? 207 : 200).json(response);
  } catch (error) {
    console.error('Email send failed:', error.message);
    return res.status(503).json({ error: error.message });
  }
});

app.post('/schedule', (req, res) => {
  const validationError = validateMessage(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!smtpSessions.has(req.user.sessionId)) {
    return res.status(428).json({ error: 'Enter and verify your SMTP app password before scheduling.' });
  }

  const scheduledAt = new Date(req.body.scheduledAt);
  if (!req.body.scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return res.status(400).json({ error: 'Choose a future date and time to schedule this message.' });
  }

  const record = {
    id: randomUUID(),
    recipients: uniqueRecipients(req.body.recipients),
    subject: req.body.subject.trim() || '(No subject)',
    message: req.body.message,
    ownerUserId: req.user.userId,
    senderName: req.user.name,
    senderEmail: req.user.email,
    smtpSessionId: req.user.sessionId,
    scheduledAt: scheduledAt.toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  persistedMessages.scheduled.push(record);
  persistMessages();
  refreshSmtpSessionExpiry(req.user.sessionId);
  scheduleNextDelivery();
  return res.status(201).json({ scheduledMessage: messageSummary(record) });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<')) {
    throw new Error('Set MONGODB_URI in Backend/.env before starting the API.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a secret of at least 32 characters in Backend/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Mail server is running on port ${port}.`);
    scheduleNextDelivery();
  });
};

startServer().catch((error) => {
  console.error('Unable to start the mail server:', error.message);
  process.exitCode = 1;
});
