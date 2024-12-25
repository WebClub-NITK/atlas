export const dummyChallenges = [
    {
      id: 1,
      name: "Basic Buffer Overflow",
      category: "PWN",
      type: "standard",
      value: 500,
      isHidden: false,
      submissions: [
        {
          userId: 2,
          teamId: 1,
          submittedAt: "2024-03-15T10:35:00Z",
          submission: "flag{dummy_flag_1}",
          isCorrect: true
        },
        {
          userId: 3,
          teamId: 1,
          submittedAt: "2024-03-15T11:20:00Z",
          submission: "flag{dummy_flag_1}",
          isCorrect: true
        },
        {
          userId: 4,
          teamId: 2,
          submittedAt: "2024-03-15T09:15:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Can you overflow this basic buffer?",
      flag: "flag{dummy_flag_1}",
      hints: [
        { id: 1, content: "Check the buffer size", cost: 50 },
        { id: 2, content: "Try using pattern create", cost: 100 }
      ],
      files: [
        { id: 1, name: "exploit.py", path: "/files/exploit.py" },
        { id: 2, name: "binary", path: "/files/binary" }
      ],
      created: "2024-03-15T10:30:00Z"
    },
    {
      id: 2,
      name: "Web Authentication Bypass",
      category: "Web",
      type: "dynamic",
      value: 300,
      isHidden: false,
      submissions: [
        {
          userId: 5,
          teamId: 2,
          submittedAt: "2024-03-16T09:20:00Z",
          submission: "flag{dummy_flag_2}",
          isCorrect: true
        },
        {
          userId: 6,
          teamId: 3,
          submittedAt: "2024-03-16T10:15:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Find a way to bypass the authentication mechanism.",
      flag: "flag{dummy_flag_2}",
      hints: [
        { id: 3, content: "Check the cookies", cost: 75 },
        { id: 4, content: "Look into session tokens", cost: 125 }
      ],
      files: [
        { id: 3, name: "auth_bypass.py", path: "/files/auth_bypass.py" }
      ],
      created: "2024-03-15T11:45:00Z"
    },
    {
      id: 3,
      name: "Memory Forensics",
      category: "Forensics",
      type: "manual_verification",
      value: 800,
      isHidden: true,
      submissions: [
        {
          userId: 7,
          teamId: 4,
          submittedAt: "2024-03-16T12:30:00Z",
          submission: "flag{dummy_flag_3}",
          isCorrect: true
        },
        {
          userId: 8,
          teamId: 5,
          submittedAt: "2024-03-16T13:00:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Analyze this memory dump and find the malware.",
      flag: "flag{dummy_flag_3}",
      hints: [
        { id: 5, content: "Focus on suspicious processes", cost: 100 },
        { id: 6, content: "Check memory strings for hints", cost: 150 }
      ],
      files: [
        { id: 4, name: "memory_dump.bin", path: "/files/memory_dump.bin" },
        { id: 5, name: "analysis_guide.pdf", path: "/files/analysis_guide.pdf" }
      ],
      created: "2024-03-16T09:15:00Z"
    },
    {
      id: 4,
      name: "Python Programming Challenge",
      category: "Programming",
      type: "code",
      value: 400,
      isHidden: false,
      submissions: [
        {
          userId: 5,
          teamId: 2,
          submittedAt: "2024-03-16T15:00:00Z",
          submission: "flag{dummy_flag_4}",
          isCorrect: true
        },
        {
          userId: 4,
          teamId: 2,
          submittedAt: "2024-03-16T16:00:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Write a Python script to solve this algorithmic challenge.",
      flag: "flag{dummy_flag_4}",
      hints: [
        { id: 7, content: "Think about edge cases", cost: 50 },
        { id: 8, content: "Optimize your algorithm", cost: 100 }
      ],
      files: [
        { id: 6, name: "problem_description.txt", path: "/files/problem_description.txt" },
        { id: 7, name: "test_cases.json", path: "/files/test_cases.json" }
      ],
      created: "2024-03-16T14:30:00Z"
    },
    {
      id: 5,
      name: "Cryptography Basics",
      category: "Crypto",
      type: "multiple_choice",
      value: 200,
      isHidden: false,
      submissions: [
        {
          userId: 7,
          teamId: 2,
          submittedAt: "2024-03-17T09:00:00Z",
          submission: "flag{dummy_flag_5}",
          isCorrect: true
        },
        {
          userId: 8,
          teamId: 5,
          submittedAt: "2024-03-17T10:30:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Test your knowledge of basic cryptographic concepts.",
      flag: "flag{dummy_flag_5}",
      hints: [
        { id: 9, content: "Understand the difference between symmetric and asymmetric encryption", cost: 25 },
        { id: 10, content: "Research RSA key generation", cost: 50 }
      ],
      files: [
        { id: 8, name: "crypto_basics.pdf", path: "/files/crypto_basics.pdf" }
      ],
      created: "2024-03-17T08:45:00Z"
    },
    {
      id: 6,
      name: "Advanced Shell Code",
      category: "PWN",
      type: "standard",
      value: 750,
      isHidden: false,
      submissions: [
        {
          userId: 7,
          teamId: 4,
          submittedAt: "2024-03-17T17:00:00Z",
          submission: "flag{dummy_flag_6}",
          isCorrect: true
        },
        {
          userId: 5,
          teamId: 2,
          submittedAt: "2024-03-17T17:30:00Z",
          submission: "flag{wrong_flag}",
          isCorrect: false
        }
      ],
      description: "Write a shellcode to exploit this binary.",
      flag: "flag{dummy_flag_6}",
      hints: [
        { id: 11, content: "Learn about shellcode encoding", cost: 100 },
        { id: 12, content: "Check for bad characters", cost: 150 }
      ],
      files: [
        { id: 9, name: "exploit_template.asm", path: "/files/exploit_template.asm" },
        { id: 10, name: "vulnerable_binary", path: "/files/vulnerable_binary" }
      ],
      created: "2024-03-17T16:20:00Z"
    }
  ];
  
  export const getChallengeById = (id) => {
    return dummyChallenges.find(challenge => challenge.id === parseInt(id));
  };
  
  export const getChallengeCategories = () => [
    "Web",
    "Crypto",
    "Forensics",
    "PWN",
    "Programming",
    "Multiple Choice",
    "Reverse Engineering"
  ];
  
  export const getChallengeTypes = () => [
    "standard",
    "code",
    "dynamic",
    "manual_verification",
    "multiple_choice"
  ]; 
  