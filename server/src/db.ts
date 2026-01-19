import Database from 'better-sqlite3';

const db = new Database('chillmate.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	collegeId TEXT UNIQUE NOT NULL,
	email TEXT,
	passwordHash TEXT NOT NULL,
	fullName TEXT,
	age INTEGER NOT NULL,
	gender TEXT,
	createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
	userId INTEGER PRIMARY KEY,
	bio TEXT,
	hobbies TEXT,
	interests TEXT,
	habits TEXT,
	avatarUrl TEXT,
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

CREATE TABLE IF NOT EXISTS study_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	hostUserId INTEGER NOT NULL,
	title TEXT NOT NULL,
	topic TEXT,
	location TEXT,
	startAt TEXT,
	maxParticipants INTEGER,
	createdAt TEXT DEFAULT (datetime('now')),
	FOREIGN KEY(hostUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invitations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	fromUserId INTEGER NOT NULL,
	toUserId INTEGER NOT NULL,
	context TEXT NOT NULL,
	referenceId INTEGER,
	status TEXT DEFAULT 'pending',
	createdAt TEXT DEFAULT (datetime('now')),
	FOREIGN KEY(fromUserId) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY(toUserId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friends (
	userId INTEGER NOT NULL,
	friendUserId INTEGER NOT NULL,
	createdAt TEXT DEFAULT (datetime('now')),
	PRIMARY KEY(userId, friendUserId),
	FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY(friendUserId) REFERENCES users(id) ON DELETE CASCADE
);
`);

export default db;


