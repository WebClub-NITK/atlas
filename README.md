
# Atlas

Atlas is an open-source platform for hosting CTF competitions, utilizing dynamic Docker orchestration to manage challenge environments. It offers an intuitive frontend, customizable admin panel, and a robust backend for seamless deployment and container management, ensuring a scalable and flexible CTF event experience.

## DB Diagram

![dbdiagram](https://github.com/user-attachments/assets/b3c64a20-2153-41dd-911f-242a70e5692b)

## Setup

### Frontend

1. Clone the repository:
   ```bash
   git clone https://github.com/WebClub-NITK/atlas.git
   ```
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the dependencies:
   ```bash
   pnpm install
   ```
4. Run the development server:
   ```bash
   pnpm run dev
   ```

### Backend

1. Navigate to the backend directory:
   ```bash
    cd backend
   ```

#### Environment Variables
1. Copy the example `.env.example` to a new `.env` file.
2. Fill in the required environment variables.

Example `.env` file:
```bash
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=your_database_port
```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python manage.py runserver
   ```

## Coding Guidelines

### Comments
- Use clear and concise comments to explain the purpose of complex code blocks. For example, `# Calculate the total price including tax`.
- Avoid redundant comments that state the obvious, such as `# Increment i by 1`.
- Use docstrings for functions and classes to describe their purpose, parameters, and return values. Example:
  ```python
  def fetch_user_data(user_id):
      """
      Fetches user data from the API.
      
      Args:
          user_id (str): The ID of the user.
      
      Returns:
          dict: The user data.
      """
  ```

### Code Style
- Use 4 spaces for indentation.
- Prefer `import` statements at the top of the file.
- Use meaningful and descriptive names for variables and functions, such as `calculate_total_price`.
- Ensure consistent use of single quotes for strings, like `'Hello, World!'`.
- Place opening braces on the same line as the statement, e.g., `if True:`.

### Variable Style
- Use snake_case for variable and function names, e.g., `user_name`.
- Use PascalCase for class names, e.g., `UserProfile`.
- Use UPPER_SNAKE_CASE for constants, e.g., `API_URL`.
- Choose meaningful and descriptive names for variables and functions, such as `calculate_total_price`.

### Commit Style
- Write clear and concise commit messages.
- Use the present tense, e.g., `Add feature` not `Added feature`.
- Capitalize the first letter of the commit message.
- Use imperative mood, e.g., `Fix bug` not `Fixed bug`.
- Include a brief description of the changes made.
- Reference relevant issue numbers in the commit message.
- Use prefixes like `fix:`, `feat:`, `frontend:`, `backend:`, `misc:` to categorize commits.

### Development Style
- Use feature branches for new features and bug fixes. For example, `feature/add-user-authentication`.
- Keep the `main` branch in a deployable state.
- Regularly pull changes from the `main` branch to keep your branch up to date.
- Perform code reviews and seek feedback from team members.
