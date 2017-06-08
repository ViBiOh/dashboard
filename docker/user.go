package docker

import (
  "github.com/ViBiOh/dashboard/auth"
}

const adminUser = `admin`
const multiAppUser = `multi`

func isAdmin(user *auth.User) bool {
  if user != nil {
    return user.role == adminUser
  }
  return false
}

func isMultiApp(user *auth.User) bool {
  if user != nil {
    return user.role == multiAppUser || user.role == adminUser
  }
  return false
}
