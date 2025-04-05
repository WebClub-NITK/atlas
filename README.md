# Atlas

Atlas is an open-source platform for hosting Capture The Flag (CTF) competitions, utilizing dynamic Docker orchestration to manage challenge environments. It offers an intuitive frontend, customizable admin panel, and a robust backend for seamless deployment and container management, ensuring a scalable and flexible CTF event experience.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Architecture](#architecture)
- [License](#license)

## Features
- Dynamic Docker orchestration for challenge environments
- Intuitive and user-friendly frontend
- Customizable admin panel
- Scalable and flexible deployment

## Getting Started

### Prerequisites
- Docker
- Docker Compose
- Node.js (for frontend)
- Python (for backend)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/WebClub-NITK/atlas.git
   cd atlas
   ```

2. Configure environment variables:
   Create a `.env` file in both `backend` and `frontend` directories and set the necessary environment variables as described in the `.env.example` files.

3. Run the services:
   ```sh
   docker-compose up --build
   ```

## Contributing

We welcome contributions from the community! To get started, please read our [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on how to contribute to the project.

### Contribution Guidelines

- Ensure your code follows the existing code style.
- Write tests for new features or bug fixes.
- Update documentation as needed.
- Be respectful in your communications.

## Architecture

### Overview
The architecture of Atlas is designed to be modular and scalable, consisting of the following main components:

- **Frontend**: A JavaScript-based web application built with React.js, providing an intuitive interface for participants and administrators.
- **Backend**: A Python-based application using Flask, responsible for handling API requests, managing challenge states, and orchestrating Docker containers.
- **Database**: PostgreSQL is used for persistent storage of user data, scores, and challenge states.
- **Docker Orchestration**: Docker and Docker Compose are used to manage challenge environments, ensuring isolation and scalability.

### Detailed Explanation

#### Frontend
The frontend is built using React.js and communicates with the backend via REST APIs. It includes:
- Participant Dashboard: Allows participants to view and solve challenges, track their progress, and view the leaderboard.
- Admin Panel: Provides administrators with tools to create and manage challenges, view participant activity, and monitor system health.

#### Backend
The backend is a Flask application that handles:
- User Authentication: Manages user registration, login, and session management.
- Challenge Management: Handles the creation, updating, and deletion of challenges.
- Scoring System: Computes and updates participant scores based on challenge completions.
- Docker Management: Orchestrates Docker containers to provide isolated challenge environments.

#### Database
PostgreSQL is used as the primary database. It stores:
- User Data: Information about participants and administrators.
- Challenge Data: Details of each challenge, including metadata and solution hints.
- Scores: Participant scores and progress data.
- EDR for reference: [here](assets/db-diagram.png)

#### Docker Orchestration
Docker and Docker Compose are used to manage the lifecycle of challenge environments. Each challenge is run in its own Docker container, ensuring isolation and reproducibility. Docker Compose is used to define and run multi-container Docker applications.

## License

See the [LICENSE](LICENSE) file for details.