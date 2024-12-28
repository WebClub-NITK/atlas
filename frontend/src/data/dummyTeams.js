export const dummyTeams = [
  {
    id: 1,
    name: "Team Alpha",
    email: "alpha@ctf.com",
    isHidden: false,
    isBanned: false,
    place: 2,
    memberCount: 2,
    users: [
      {
        id: 1,
        username: "john_doe",
        email: "john@ctf.com",
        points: 1500,
        teamId: 1
      },
      {
        id: 2,
        username: "mary_smith",
        email: "mary@ctf.com",
        points: 1200,
        teamId: 1
      }
    ],
    solvedChallenges: [
      {
        id: 1,
        name: "Basic Buffer Overflow",
        category: "PWN",
        points: 500,
        solvedAt: "2024-03-15T10:30:00Z",
        solvedBy: {
          id: 1,
          username: "john_doe"
        }
      },
      {
        id: 2,
        name: "Simple XSS",
        category: "Web",
        points: 300,
        solvedAt: "2024-03-15T11:45:00Z",
        solvedBy: {
          id: 2,
          username: "mary_smith"
        }
      }
    ]
  },
  {
    id: 2,
    name: "Binary Bandits",
    email: "bandits@ctf.com",
    isHidden: false,
    isBanned: false,
    points: 4400,
    place: 1,
    memberCount: 3,
    users: [
      {
        id: 3,
        username: "alice_hack",
        email: "alice@ctf.com",
        points: 2000,
        teamId: 2
      },
      {
        id: 4,
        username: "bob_secure",
        email: "bob@ctf.com",
        points: 1800,
        teamId: 2
      },
      {
        id: 5,
        username: "charlie_pwn",
        email: "charlie@ctf.com",
        points: 1600,
        teamId: 2
      }
    ],
    solvedChallenges: [
      {
        id: 3,
        name: "Advanced Heap Exploitation",
        category: "PWN",
        points: 800,
        solvedAt: "2024-03-16T09:15:00Z",
        solvedBy: {
          id: 3,
          username: "alice_hack"
        }
      },
      {
        id: 4,
        name: "SQL Injection Master",
        category: "Web",
        points: 600,
        solvedAt: "2024-03-16T14:20:00Z",
        solvedBy: {
          id: 4,
          username: "bob_secure"
        }
      }
    ]
  },
  {
    id: 3,
    name: "Crypto Crusaders",
    email: "crusaders@ctf.com",
    isHidden: true,
    isBanned: false,
    points: 2200,
    place: 3,
    memberCount: 2,
    users: [
      {
        id: 6,
        username: "dave_crypto",
        email: "dave@ctf.com",
        points: 2500,
        teamId: 3
      },
      {
        id: 7,
        username: "eve_hash",
        email: "eve@ctf.com",
        points: 2200,
        teamId: 3
      }
    ],
    solvedChallenges: [
      {
        id: 5,
        name: "RSA Challenge",
        category: "Crypto",
        points: 700,
        solvedAt: "2024-03-17T11:30:00Z",
        solvedBy: {
          id: 6,
          username: "dave_crypto"
        }
      }
    ]
  },
  {
    id: 4,
    name: "Web Warriors",
    email: "warriors@ctf.com",
    isHidden: false,
    isBanned: true,
    points: 1000,
    place: 6,
    memberCount: 1,
    users: [
      {
        id: 8,
        username: "frank_web",
        email: "frank@ctf.com",
        points: 1000,
        teamId: 4
      }
    ],
    solvedChallenges: [
      {
        id: 6,
        name: "JWT Exploitation",
        category: "Web",
        points: 400,
        solvedAt: "2024-03-18T16:45:00Z",
        solvedBy: {
          id: 8,
          username: "frank_web"
        }
      }
    ]
  },
  {
    id: 5,
    name: "Reverse Rangers",
    email: "rangers@ctf.com",
    isHidden: false,
    isBanned: false,
    points: 1900,
    place: 4,
    memberCount: 2,
    users: [
      {
        id: 9,
        username: "grace_asm",
        email: "grace@ctf.com",
        points: 3000,
        teamId: 5
      },
      {
        id: 10,
        username: "henry_debug",
        email: "henry@ctf.com",
        points: 2800,
        teamId: 5
      }
    ],
    solvedChallenges: [
      {
        id: 7,
        name: "Android RE Challenge",
        category: "Reverse",
        points: 900,
        solvedAt: "2024-03-19T13:20:00Z",
        solvedBy: {
          id: 9,
          username: "grace_asm"
        }
      },
      {
        id: 8,
        name: "Windows Malware Analysis",
        category: "Reverse",
        points: 1000,
        solvedAt: "2024-03-19T15:30:00Z",
        solvedBy: {
          id: 10,
          username: "henry_debug"
        }
      }
    ]
  },
  {
    id: 6,
    name: "Forensics Force",
    email: "force@ctf.com",
    isHidden: false,
    isBanned: false,
    points: 1700,
    place: 5,
    memberCount: 2,
    users: [
      {
        id: 11,
        username: "ian_memory",
        email: "ian@ctf.com",
        points: 1700,
        teamId: 6
      },
      {
        id: 12,
        username: "julia_disk",
        email: "julia@ctf.com",
        points: 1600,
        teamId: 6
      }
    ],
    solvedChallenges: [
      {
        id: 9,
        name: "Memory Dump Analysis",
        category: "Forensics",
        points: 500,
        solvedAt: "2024-03-20T10:15:00Z",
        solvedBy: {
          id: 11,
          username: "ian_memory"
        }
      }
    ]
  }
];

export const getTeamById = (id) => {
  return dummyTeams.find(team => team.id === parseInt(id));
}; 