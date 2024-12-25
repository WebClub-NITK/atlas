export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(String(email).toLowerCase())
}

export const validatePassword = (password) => {
  return password.length >= 8
}

export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_-]{3,20}$/
  return re.test(username)
}

