import db from "./db.js";
import bcrypt from "bcryptjs";

async function seedUsers() {
  console.log("🌱 Seeding test users...");

  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    {
      collegeId: "20231CSE0678",
      fullName: "Ananya",
      age: 19,
      gender: "Female",
      bio: "Love dancing and performing on stage 💃",
      hobbies: "Dance, Music",
      interests: "Dance, Travel"
    },
    {
      collegeId: "20231CSE0679",
      fullName: "Rahul",
      age: 20,
      gender: "Male",
      bio: "Competitive gamer and tech nerd 🎮",
      hobbies: "Gaming, Coding",
      interests: "Gaming, Tech"
    },
    {
      collegeId: "20231CSE0680",
      fullName: "Priya",
      age: 18,
      gender: "Female",
      bio: "Dream traveler looking for trip mates ✈️",
      hobbies: "Travel, Photography",
      interests: "Travel, Nature"
    }
  ];

  for (const u of users) {
    const exists = db
      .prepare("SELECT id FROM users WHERE collegeId = ?")
      .get(u.collegeId);

    if (exists) {
      console.log(`User ${u.collegeId} already exists, skipping.`);
      continue;
    }

    const user = db
      .prepare(`
      INSERT INTO users (collegeId, passwordHash, fullName, age, gender)
      VALUES (?, ?, ?, ?, ?)
    `)
      .run(u.collegeId, passwordHash, u.fullName, u.age, u.gender);

    db.prepare(`
      INSERT INTO profiles (userId, bio, hobbies, interests)
      VALUES (?, ?, ?, ?)
    `).run(
      user.lastInsertRowid,
      u.bio,
      u.hobbies,
      u.interests
    );

    console.log(`Inserted ${u.fullName}`);
  }

  console.log("✅ Seeding complete!");
}

seedUsers();
