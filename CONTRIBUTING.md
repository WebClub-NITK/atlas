## Steps to Contribute

1. Create an issue and get the fix/feature aproved by a maintainer.
2. Fork the repository.
3. Create a new branch (`git checkout -b feature/your-feature-name`).
4. Make your changes.
5. Commit your changes (Refer to [Commit Message Format](#commit-message-format)).
6. Push to the branch (`git push origin feature/your-feature-name`).
7. Open a pull request (Make sure to fill out the template).

### Commit Message Format

A good commit message should be concise yet descriptive, providing enough context for someone to understand the changes made. Here's a recommended format:

1. **Header**: A single line that summarizes the changes.
2. **Body**: (Optional) A more detailed explanation of what changes were made and why.
3. **Footer**: (Optional) Any references to issues or pull requests that this commit addresses.

#### Example Format

```
[<scope>] <type>: <subject>

<body>

<footer>
```

#### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring without adding features or fixing bugs
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to the build system or dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify `src` or `test` files
- `revert`: Reverts a previous commit

#### Example Commit Messages

```
[auth] feat: add OAuth2 login support

Added OAuth2 login support to allow users to authenticate using their Google and Facebook accounts. This enhances user experience by providing more authentication options.

Fixes #123
```

```
[api] fix: correct data validation in user endpoint

Fixed an issue where the user endpoint was not validating email addresses correctly. Added a regular expression check to ensure valid email format.

Closes #456
```