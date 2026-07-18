const UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DIECIS = [
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISÉIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];
const VEINTIS = [
  "VEINTE",
  "VEINTIUNO",
  "VEINTIDÓS",
  "VEINTITRÉS",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISÉIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];
const DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

/** Convierte un número de 0 a 999 a letras. */
function grupoALetras(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];

  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DIECIS[resto - 10]);
    else if (resto < 30) partes.push(VEINTIS[resto - 20]);
    else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      partes.push(unidad > 0 ? `${DECENAS[decena]} Y ${UNIDADES[unidad]}` : DECENAS[decena]);
    }
  }

  return partes.join(" ");
}

/** Apócope de "uno" antes de un sustantivo (ej. "VEINTIUNO" -> "VEINTIÚN", "CIENTO UNO" -> "CIENTO UN"). */
function apocoparUno(texto: string): string {
  if (texto.endsWith("VEINTIUNO")) return texto.replace(/VEINTIUNO$/, "VEINTIÚN");
  if (texto.endsWith("UNO")) return texto.replace(/UNO$/, "UN");
  return texto;
}

function enteroALetras(entero: number): string {
  if (entero === 0) return "CERO";

  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const centenas = entero % 1000;
  const partes: string[] = [];

  if (millones > 0) {
    partes.push(millones === 1 ? "UN MILLÓN" : `${apocoparUno(grupoALetras(millones))} MILLONES`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? "MIL" : `${apocoparUno(grupoALetras(miles))} MIL`);
  }
  if (centenas > 0) {
    partes.push(grupoALetras(centenas));
  }

  return apocoparUno(partes.join(" "));
}

/** Importe en letras al estilo de un recibo/cheque mexicano, ej. 900 -> "NOVECIENTOS PESOS 00/100 M.N.". */
export function montoEnLetras(monto: number): string {
  const absoluto = Math.abs(monto);
  const entero = Math.floor(absoluto);
  const centavos = Math.round((absoluto - entero) * 100);
  const centavosStr = String(centavos).padStart(2, "0");

  if (entero === 1) return `UN PESO ${centavosStr}/100 M.N.`;
  return `${enteroALetras(entero)} PESOS ${centavosStr}/100 M.N.`;
}
