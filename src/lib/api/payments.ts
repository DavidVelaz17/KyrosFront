import type { CreatePaymentInput, Payment } from "@/lib/types/payment";
import { LocalJsonStore } from "@/lib/storage/local-json-store";
import { seedPayments } from "@/lib/mock/seed-payments";
import { seedStudents } from "@/lib/mock/seed-students";
import { generateId } from "@/lib/utils/id";
import { todayISODate } from "@/lib/utils/format";
import { delay } from "@/lib/api/delay";

const paymentsStore = new LocalJsonStore<Payment>("kyros:payments", () => seedPayments(seedStudents()));

export async function listPayments(): Promise<Payment[]> {
  return delay(paymentsStore.getAll());
}

export async function listPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const payments = paymentsStore.getAll().filter((payment) => payment.studentId === studentId);
  return delay(payments);
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const payment: Payment = {
    id: generateId(),
    fecha: input.fecha ?? todayISODate(),
    ...input,
  };
  paymentsStore.add(payment);
  return delay(payment);
}
