type User = {
  id: number;
  uid: string;
  age: number;
  email: string;
  user_name: string;
  private: number;
};

export type ResponseLocals = { user: User };
