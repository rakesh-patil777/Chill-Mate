import Database from "better-sqlite3";

const db = new Database("chillmate.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Single schema definition: users, profiles, likes, matches
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collegeId TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fullName TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  isAdmin INTEGER NOT NULL DEFAULT 0,
  premiumUntil TEXT DEFAULT NULL,
  profileBoostUntil TEXT DEFAULT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  userId INTEGER PRIMARY KEY,
  bio TEXT DEFAULT 'Hi there! I am using Chill Mate.',
  hobbies TEXT DEFAULT '',
  interests TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  year INTEGER DEFAULT NULL,
  avatarUrl TEXT DEFAULT NULL,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  fromUserId INTEGER NOT NULL,
  toUserId INTEGER NOT NULL,
  liked INTEGER NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'like',
  createdAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (fromUserId, toUserId),
  FOREIGN KEY(fromUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(toUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userA INTEGER NOT NULL,
  userB INTEGER NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userA, userB),
  FOREIGN KEY(userA) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(userB) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromUserId INTEGER NOT NULL,
  toUserId INTEGER NOT NULL,
  text TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  seenAt TEXT DEFAULT NULL,
  FOREIGN KEY(fromUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(toUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_reads (
  userId INTEGER PRIMARY KEY,
  lastSeenAt TEXT NOT NULL DEFAULT '1970-01-01 00:00:00',
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  referenceId INTEGER,
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_blocks (
  blockerUserId INTEGER NOT NULL,
  blockedUserId INTEGER NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (blockerUserId, blockedUserId),
  FOREIGN KEY(blockerUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(blockedUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporterUserId INTEGER NOT NULL,
  reportedUserId INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(reporterUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reportedUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS swipe_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  targetUserId INTEGER NOT NULL,
  reaction TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(targetUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  startsAt TEXT NOT NULL DEFAULT (datetime('now')),
  expiresAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chill_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostUserId INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  startAt TEXT,
  maxGuests INTEGER,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(hostUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_attendees (
  planId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  joinedAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (planId, userId),
  FOREIGN KEY(planId) REFERENCES chill_plans(id) ON DELETE CASCADE,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_likes_from ON likes(fromUserId);
CREATE INDEX IF NOT EXISTS idx_likes_to ON likes(toUserId);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(userA, userB);
CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(fromUserId, toUserId);
CREATE INDEX IF NOT EXISTS idx_messages_to_seen ON messages(toUserId, seenAt);
CREATE INDEX IF NOT EXISTS idx_plan_attendees_plan ON plan_attendees(planId);
CREATE INDEX IF NOT EXISTS idx_plan_attendees_user ON plan_attendees(userId);
CREATE INDEX IF NOT EXISTS idx_swipe_events_user_date ON swipe_events(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_swipe_events_date ON swipe_events(createdAt);
CREATE INDEX IF NOT EXISTS idx_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead);
CREATE INDEX IF NOT EXISTS idx_feedback_user_date ON feedback_submissions(userId, createdAt);
`);

function ensureColumn(
  tableName: string,
  columnName: string,
  sqlFragment: string
) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;
  if (!columns.some((col) => col.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlFragment}`);
  }
}

ensureColumn("likes", "reaction", "TEXT NOT NULL DEFAULT 'like'");
db.exec("UPDATE likes SET reaction = 'dislike' WHERE liked = 0 AND reaction IS NULL");
ensureColumn("users", "isAdmin", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "premiumUntil", "TEXT DEFAULT NULL");
ensureColumn("users", "profileBoostUntil", "TEXT DEFAULT NULL");
ensureColumn("users", "referredBy", "INTEGER DEFAULT NULL");
ensureColumn("users", "inviteCount", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "plansHosted", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "reputationBoost", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "lastActiveDate", "TEXT DEFAULT NULL");
ensureColumn("users", "swipeStreak", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "campusStreak", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("profiles", "branch", "TEXT DEFAULT ''");
ensureColumn("profiles", "year", "INTEGER DEFAULT NULL");
ensureColumn("profiles", "photos", "TEXT DEFAULT '[]'");
ensureColumn("chill_plans", "status", "TEXT NOT NULL DEFAULT 'active'");
ensureColumn("messages", "planId", "INTEGER DEFAULT NULL");
ensureColumn("messages", "type", "TEXT NOT NULL DEFAULT 'text'");
ensureColumn("plan_attendees", "attended", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("plan_attendees", "markedByHost", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("feedback_submissions", "status", "TEXT NOT NULL DEFAULT 'new'");
db.exec("CREATE INDEX IF NOT EXISTS idx_feedback_status_date ON feedback_submissions(status, createdAt)");
db.exec("CREATE INDEX IF NOT EXISTS idx_messages_plan ON messages(planId, createdAt)");
db.exec(`
CREATE TABLE IF NOT EXISTS host_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  planId INTEGER NOT NULL,
  hostUserId INTEGER NOT NULL,
  reviewerUserId INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  feedback TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(planId, reviewerUserId),
  FOREIGN KEY(planId) REFERENCES chill_plans(id) ON DELETE CASCADE,
  FOREIGN KEY(hostUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewerUserId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_host_ratings_host ON host_ratings(hostUserId);
CREATE INDEX IF NOT EXISTS idx_host_ratings_plan ON host_ratings(planId);
CREATE INDEX IF NOT EXISTS idx_plan_attendees_attended ON plan_attendees(userId, attended);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referredBy);
`);
db.exec(`
UPDATE users
SET plansHosted = (
  SELECT COUNT(*)
  FROM chill_plans cp
  WHERE cp.hostUserId = users.id
);
`);
db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES ('launchMode', 'open')").run();
db.prepare(
  "INSERT OR IGNORE INTO app_config (key, value) VALUES ('campusUnlockThreshold', '100')"
).run();

export default db;
