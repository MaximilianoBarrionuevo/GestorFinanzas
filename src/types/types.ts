export type transactions = {
  id: string
  user_id: string
  amount: number
  category: string
  date: string
  type: "ingreso" | "egreso"
}

export type services = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  charge_day: number;
  category: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};
