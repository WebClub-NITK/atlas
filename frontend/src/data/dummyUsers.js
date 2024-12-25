export const dummyUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@ctfd.io",
    isAdmin: true,
    isVerified: true,
    isHidden: true,
    isBanned: false,
    team: "Admin Team",
    teamId: null,
    points: 1000,
    solvedChallenges: [
      { id: 1, name: "Web 101", points: 100, solvedAt: "2024-03-15" },
      { id: 2, name: "Crypto Basic", points: 150, solvedAt: "2024-03-16" },
      { id: 3, name: "Forensics Master", points: 300, solvedAt: "2024-03-17" }
    ]
  },
  {
    id: 2,
    username: "mary",
    email: "mary@yahoo.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: false,
    team: "Team Alpha",
    teamId: 1,
    points: 750,
    solvedChallenges: [
      { id: 1, name: "Web 101", points: 100, solvedAt: "2024-03-15" },
      { id: 4, name: "Binary 201", points: 200, solvedAt: "2024-03-18" }
    ]
  },
  {
    id: 3,
    username: "john_doe",
    email: "john@gmail.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: false,
    team: "Binary Bandits",
    teamId: 2,
    points: 450,
    solvedChallenges: [
      { id: 1, name: "Web 101", points: 100, solvedAt: "2024-03-16" },
      { id: 5, name: "Network Basic", points: 150, solvedAt: "2024-03-17" }
    ]
  },
  {
    id: 4,
    username: "alice_sec",
    email: "alice@outlook.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: false,
    team: "Binary Bandits",
    teamId: 2,
    points: 900,
    solvedChallenges: [
      { id: 2, name: "Crypto Basic", points: 150, solvedAt: "2024-03-15" },
      { id: 6, name: "Advanced Exploitation", points: 400, solvedAt: "2024-03-16" }
    ]
  },
  {
    id: 5,
    username: "bob_hacker",
    email: "bob@protonmail.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: true,
    team: "Solo Player",
    teamId: null,
    points: 300,
    solvedChallenges: [
      { id: 1, name: "Web 101", points: 100, solvedAt: "2024-03-15" }
    ]
  },
  {
    id: 6,
    username: "carol_crypto",
    email: "carol@gmail.com",
    isAdmin: false,
    isVerified: false,
    isHidden: false,
    isBanned: false,
    team: "Crypto Crusaders",
    teamId: 3,
    points: 600,
    solvedChallenges: [
      { id: 2, name: "Crypto Basic", points: 150, solvedAt: "2024-03-16" },
      { id: 7, name: "RSA Challenge", points: 250, solvedAt: "2024-03-17" }
    ]
  },
  {
    id: 7,
    username: "dave_debug",
    email: "dave@yahoo.com",
    isAdmin: false,
    isVerified: true,
    isHidden: true,
    isBanned: false,
    team: "Web Warriors",
    teamId: 4,
    points: 800,
    solvedChallenges: [
      { id: 8, name: "Reverse Engineering 101", points: 200, solvedAt: "2024-03-15" },
      { id: 9, name: "Memory Forensics", points: 300, solvedAt: "2024-03-16" }
    ]
  },
  {
    id: 8,
    username: "eve_exploit",
    email: "eve@outlook.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: false,
    team: "Reverse Rangers",
    teamId: 5,
    points: 550,
    solvedChallenges: [
      { id: 10, name: "Buffer Overflow", points: 250, solvedAt: "2024-03-17" },
      { id: 11, name: "SQL Injection", points: 200, solvedAt: "2024-03-18" }
    ]
  },
  {
    id: 9,
    username: "frank_forensics",
    email: "frank@gmail.com",
    isAdmin: false,
    isVerified: false,
    isHidden: false,
    isBanned: false,
    team: "Forensics Force",
    teamId: 6,
    points: 400,
    solvedChallenges: [
      { id: 12, name: "Digital Forensics", points: 200, solvedAt: "2024-03-15" }
    ]
  },
  {
    id: 10,
    username: "grace_pwn",
    email: "grace@protonmail.com",
    isAdmin: false,
    isVerified: true,
    isHidden: false,
    isBanned: false,
    team: "Forensics Force",
    teamId: 6,
    points: 700,
    solvedChallenges: [
      { id: 13, name: "PWN 101", points: 150, solvedAt: "2024-03-16" },
      { id: 14, name: "Heap Exploitation", points: 350, solvedAt: "2024-03-17" }
    ]
  }
];

export const getChallengeCategories = () => [
  "Web",
  "Crypto",
  "Forensics",
  "Binary",
  "Network",
  "PWN",
  "Reverse Engineering"
];

export const getUserById = (id) => {
  return dummyUsers.find(user => user.id === parseInt(id));
}; 