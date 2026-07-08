import type { Horario, IngresoA, Student } from "@/lib/types/student";
import { HORARIO_OPTIONS } from "@/lib/types/student";
import { suggestMatricula } from "@/lib/utils/matricula";
import { mulberry32, pick, pickInt } from "@/lib/mock/random";
import { SEED_GROUP_IDS } from "@/lib/mock/seed-groups";

const NOMBRES = [
  "María", "José", "Luis", "Ana", "Carlos", "Fernanda", "Diego", "Valeria",
  "Miguel", "Sofía", "Jorge", "Camila", "Alejandro", "Regina", "Emiliano",
  "Ximena", "Ricardo", "Paola", "Iván", "Renata", "Sergio", "Daniela",
  "Andrés", "Mariana", "Pablo",
];
const APELLIDOS = [
  "García", "Hernández", "Martínez", "López", "González", "Pérez", "Sánchez",
  "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes",
  "Cruz", "Morales", "Ortiz", "Chávez", "Ramos", "Vázquez",
];
const ESCUELAS = [
  "UNAM", "IPN", "Universidad Iberoamericana", "ITESM", "UAM", "Universidad Anáhuac",
  "Preparatoria 8", "CETIS 5", "Secundaria Técnica 34",
];
const GRADOS = ["1er semestre", "2do semestre", "3er semestre", "4to semestre", "5to semestre", "6to semestre"];
const COLONIAS = ["Roma Norte", "Del Valle", "Narvarte", "Coyoacán", "Polanco", "Doctores", "Tlalpan"];

const GROUP_CONFIG: { grupoId: string; ingresoA: IngresoA; count: number }[] = [
  { grupoId: SEED_GROUP_IDS.sistemas, ingresoA: "Universidad", count: 25 },
  { grupoId: SEED_GROUP_IDS.derecho, ingresoA: "Universidad", count: 15 },
  { grupoId: SEED_GROUP_IDS.verano, ingresoA: "Curso de verano", count: 8 },
];

export function seedStudents(): Student[] {
  const random = mulberry32(42);
  const students: Student[] = [];
  const year = 2026;

  for (const config of GROUP_CONFIG) {
    for (let sequence = 1; sequence <= config.count; sequence += 1) {
      const nombre = pick(random, NOMBRES);
      const apellidoPaterno = pick(random, APELLIDOS);
      const apellidoMaterno = pick(random, APELLIDOS);
      const horario = pick<Horario>(random, HORARIO_OPTIONS);

      students.push({
        id: `stu-${config.grupoId}-${sequence}`,
        matricula: suggestMatricula(config.ingresoA, year, sequence),
        ingresoA: config.ingresoA,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        edad: pickInt(random, 15, 24),
        telefono: `55${pickInt(random, 10000000, 99999999)}`,
        escuelaProcedencia: pick(random, ESCUELAS),
        gradoEscolar: pick(random, GRADOS),
        tutorNombre: `${pick(random, NOMBRES)} ${pick(random, APELLIDOS)}`,
        tutorTelefono: `55${pickInt(random, 10000000, 99999999)}`,
        direccion: `Calle ${pickInt(random, 1, 200)}, Col. ${pick(random, COLONIAS)}, CDMX`,
        fotoUrl: null,
        notas: "",
        fechaInscripcion: `${year}-0${pickInt(random, 1, 6)}-${String(pickInt(random, 1, 28)).padStart(2, "0")}`,
        grupoId: config.grupoId,
        horario,
      });
    }
  }

  return students;
}
