import type { CreateStudentInput, Student } from "@/lib/types/student";
import { LocalJsonStore } from "@/lib/storage/local-json-store";
import { seedStudents } from "@/lib/mock/seed-students";
import { generateId } from "@/lib/utils/id";
import { todayISODate } from "@/lib/utils/format";
import { delay } from "@/lib/api/delay";

const studentsStore = new LocalJsonStore<Student>("kyros:students", seedStudents);

export async function listStudentsByGroup(groupId: string): Promise<Student[]> {
  const students = studentsStore.getAll().filter((student) => student.grupoId === groupId);
  return delay(students);
}

export async function listAllStudents(): Promise<Student[]> {
  return delay(studentsStore.getAll());
}

export async function getStudent(id: string): Promise<Student | null> {
  const student = studentsStore.getAll().find((item) => item.id === id) ?? null;
  return delay(student);
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  const student: Student = {
    id: generateId(),
    fechaInscripcion: todayISODate(),
    ...input,
  };
  studentsStore.add(student);
  return delay(student);
}

export async function listExistingMatriculas(): Promise<string[]> {
  return delay(studentsStore.getAll().map((student) => student.matricula));
}
