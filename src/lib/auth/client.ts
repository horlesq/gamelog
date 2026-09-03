export async function logoutUser() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  return response.json()
}

export async function getCurrentUser() {
  const response = await fetch('/api/auth/me')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required - 401')
    }
    throw new Error('Failed to fetch user data')
  }

  return response.json()
}

export async function updateProfile(profileData: {
  currentPassword: string
  email?: string
  newPassword?: string
}) {
  const response = await fetch('/api/auth/update-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update profile')
  }

  return response.json()
}

export async function loginUser(credentials: { email: string; password: string }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Login failed')
    }
    // Server returned a non-JSON response (e.g. crash/HTML error page)
    if (response.status >= 500) {
      throw new Error('Server error - the database may not be set up. Run "prisma generate" and "prisma db push", then restart the dev server.')
    }
    throw new Error('Login failed')
  }

  return response.json()
}