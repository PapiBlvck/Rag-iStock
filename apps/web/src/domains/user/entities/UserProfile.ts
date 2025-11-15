/**
 * User profile entity
 */
export interface UserProfile {
  id: string;
  email: string;
  role: 'Farmer';
  displayName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new user profile entity
 */
export function createUserProfile(
  data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): UserProfile {
  const now = new Date();
  return {
    id: data.id || '',
    email: data.email,
    role: data.role,
    displayName: data.displayName,
    createdAt: now,
    updatedAt: now,
  };
}

