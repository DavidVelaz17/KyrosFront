import type { Payment } from "@/lib/types/payment";
import { PAYMENT_CONCEPT_OPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS } from "@/lib/types/payment";
import { mulberry32, pick, pickInt } from "@/lib/mock/random";
import type { Student } from "@/lib/types/student";

/** Generates a short payment history for a subset of students so the demo has data out of the box. */
export function seedPayments(students: Student[]): Payment[] {
  const random = mulberry32(7);
  const payments: Payment[] = [];

  students.forEach((student, index) => {
    if (index % 3 === 0) return;

    const paymentsCount = pickInt(random, 1, 3);
    for (let i = 0; i < paymentsCount; i += 1) {
      payments.push({
        id: `pay-${student.id}-${i}`,
        studentId: student.id,
        concepto: i === 0 ? "Inscripción" : pick(random, PAYMENT_CONCEPT_OPTIONS),
        tipoMensualidad: i === 0 ? "Pago completo" : pick(random, PAYMENT_PLAN_TYPE_OPTIONS),
        monto: i === 0 ? 1500 : pickInt(random, 800, 2500),
        metodoPago: pick(random, PAYMENT_METHOD_OPTIONS),
        fecha: `2026-0${pickInt(random, 1, 6)}-${String(pickInt(random, 1, 28)).padStart(2, "0")}`,
        notas: "",
      });
    }
  });

  return payments;
}
