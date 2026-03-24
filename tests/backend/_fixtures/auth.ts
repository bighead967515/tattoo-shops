export type MockSupabaseUser = {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
};

export function createMockSupabaseUser(
  overrides: Partial<MockSupabaseUser> = {},
): MockSupabaseUser {
  return {
    id: "user-open-id-1",
    email: "tester@example.com",
    user_metadata: {
      name: "Test User",
    },
    ...overrides,
  };
}

export function createGetUserSuccess(user: MockSupabaseUser) {
  return {
    data: {
      user,
    },
    error: null,
  };
}

export function createGetUserFailure(message = "Invalid token") {
  return {
    data: {
      user: null,
    },
    error: {
      message,
    },
  };
}
