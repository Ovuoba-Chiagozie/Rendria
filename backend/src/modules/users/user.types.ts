export type User = {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  subscription_plan: string;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  lemon_subscription_id: string | null;
};

export type UserWithPassword = User & { password_hash: string };

export const USER_COLUMNS =
  'id,email,name,credits,subscription_plan,subscription_status,subscription_current_period_end,lemon_subscription_id';

export function publicUser(user: User) {
  return { _id: user.id, email: user.email, name: user.name };
}
