export type transactions = {
  id: string
  user_id: string
  amount: number
  category: string
  description: string
  date: string
  type: "ingreso" | "egreso"
}

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type services = {
  id?: string
  user_id: string
  nombre: string
  monto: number
  frecuencia: "mensual" | "anual" | "unico"
  proximo_pago: string
  created_at?: string
}

