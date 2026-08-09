/**
 * Validación de las respuestas del formulario público.
 *
 * El problema que resuelve: si alguien escribe "11111" como nombre o
 * "a@a.a" como email, la base se llena de fichas que no sirven para nada —
 * no se puede segmentar ni contactar a nadie con eso.
 *
 * La regla es rechazar lo que es *evidentemente* inventado, no adivinar quién
 * miente. Un falso positivo es peor que un dato malo: le impide completar el
 * formulario a alguien real, y ese cliente se pierde para siempre.
 *
 * Vive en `lib/` a propósito: corre en el navegador para avisar mientras se
 * escribe, y otra vez en el servidor, porque cualquier control del cliente se
 * puede saltear mandando el pedido a mano.
 */

export interface Problema {
  /** Qué mostrarle a quien está completando. */
  mensaje: string;
  /** Corrección propuesta, cuando parece un error de tipeo. */
  sugerencia?: string;
}

/* ————— Utilidades ————— */

/** Sin tildes y en minúsculas, para comparar contra listas. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** "aaaa", "1111", "....": un solo carácter repetido. */
function unSoloCaracter(s: string): boolean {
  const limpio = s.replace(/\s/g, "");
  return limpio.length >= 3 && new Set(limpio).size === 1;
}

/** "1234", "abcd", "9876": una tirada seguida del teclado o de los números. */
function esSecuencia(s: string): boolean {
  const limpio = s.replace(/\s/g, "");
  if (limpio.length < 4) return false;
  let sube = true;
  let baja = true;
  for (let i = 1; i < limpio.length; i++) {
    const d = limpio.charCodeAt(i) - limpio.charCodeAt(i - 1);
    if (d !== 1) sube = false;
    if (d !== -1) baja = false;
  }
  return sube || baja;
}

/** Filas del teclado: lo que sale de pasar el dedo para salir del paso. */
const TECLADO = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];

function esManotazoDeTeclado(s: string): boolean {
  const t = normalizar(s).replace(/\s/g, "");
  if (t.length < 4) return false;
  return TECLADO.some((fila) => fila.includes(t) || [...fila].reverse().join("").includes(t));
}

/* ————— Nombre ————— */

const NOMBRES_FALSOS = new Set([
  "test", "prueba", "asd", "asdf", "asdasd", "qwe", "qwerty", "aaa", "nada",
  "ninguno", "ninguna", "no", "nn", "xx", "xxx", "anonimo", "sin nombre",
  "n/a", "na", "-", ".", "abc", "hola", "cliente", "usuario",
]);

/**
 * ¿El nombre parece de verdad?
 *
 * Se exige que tenga letras: un nombre de persona las tiene, y "11111" no.
 */
export function validarNombre(valor: string): Problema | null {
  const s = valor.trim();
  if (s.length < 2) return { mensaje: "Escribí tu nombre para poder identificarte" };
  if (s.length > 80) return { mensaje: "Ese nombre es demasiado largo" };

  const letras = (s.match(/\p{L}/gu) ?? []).length;
  if (letras < 2) return { mensaje: "Escribí tu nombre, no un número" };

  // Más dígitos que letras: "juan1234567" pasa, "1234567juan" no.
  const digitos = (s.match(/\d/g) ?? []).length;
  if (digitos > letras) return { mensaje: "Ese nombre tiene más números que letras" };

  // Ningún nombre real arranca con números.
  if (/^\d/.test(s)) return { mensaje: "El nombre no puede empezar con números" };

  if (unSoloCaracter(s)) return { mensaje: "Ese no parece un nombre real" };
  if (esSecuencia(s)) return { mensaje: "Ese no parece un nombre real" };
  if (esManotazoDeTeclado(s)) return { mensaje: "Ese no parece un nombre real" };
  if (NOMBRES_FALSOS.has(normalizar(s))) return { mensaje: "Necesitamos tu nombre real para el beneficio" };

  return null;
}

/* ————— Email ————— */

/** Dominios de correo temporal: sirven una vez y después no se puede contactar. */
const DOMINIOS_DESCARTABLES = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "throwawaymail.com", "trashmail.com",
  "sharklasers.com", "getnada.com", "maildrop.cc", "fakeinbox.com",
  "mailnesia.com", "dispostable.com", "spam4.me", "grr.la", "correotemporal.org",
]);

/** Errores de tipeo frecuentes → dominio correcto. */
const TIPEOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com",
  "gmail.con": "gmail.com", "gmil.com": "gmail.com", "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com", "hotmial.con": "hotmail.com", "otmail.com": "hotmail.com",
  "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "outlok.com": "outlook.com",
  "outllok.com": "outlook.com", "livee.com": "live.com",
};

export function validarEmail(valor: string): Problema | null {
  const s = valor.trim().toLowerCase();
  if (!s) return null;

  const partes = s.split("@");
  if (partes.length !== 2) return { mensaje: "Falta el @ o hay más de uno" };

  const [local, dominio] = partes as [string, string];
  if (!local || !dominio) return { mensaje: "Ese email está incompleto" };
  if (/\s/.test(s)) return { mensaje: "El email no puede tener espacios" };

  // El dominio necesita punto y una extensión de al menos dos letras.
  const m = dominio.match(/^([a-z0-9-]+\.)+([a-z]{2,})$/);
  if (!m) return { mensaje: "Revisá el dominio: falta el .com o similar" };

  const tipeo = TIPEOS[dominio];
  if (tipeo) {
    return {
      mensaje: `¿Quisiste decir ${local}@${tipeo}?`,
      sugerencia: `${local}@${tipeo}`,
    };
  }

  if (DOMINIOS_DESCARTABLES.has(dominio)) {
    return { mensaje: "Ese correo es temporal. Poné uno donde podamos escribirte" };
  }

  if (local.length < 2) return { mensaje: "Ese email es demasiado corto" };
  if (unSoloCaracter(local)) return { mensaje: "Ese no parece un email real" };
  if (esManotazoDeTeclado(local)) return { mensaje: "Ese no parece un email real" };
  if (["test", "asd", "asdf", "nada", "noexiste", "aaa"].includes(local)) {
    return { mensaje: "Ese no parece un email real" };
  }

  return null;
}

/* ————— Teléfono ————— */

/**
 * Teléfono argentino.
 *
 * Se aceptan todos los formatos con los que la gente lo escribe (con 0, con 15,
 * con +54, con guiones) y se juzga sólo la cantidad de dígitos y que no sea un
 * relleno obvio. Es el dato más valioso del formulario, pero también en el que
 * más se equivocan: conviene ser flexible con la forma y estricto con lo falso.
 */
export function validarTelefono(valor: string): Problema | null {
  const s = valor.trim();
  if (!s) return null;

  if (/[a-z]/i.test(s.replace(/^\+/, ""))) {
    return { mensaje: "El teléfono va sólo con números" };
  }

  const d = s.replace(/\D/g, "");
  if (d.length < 8) return { mensaje: "Faltan números. Poné el celular con característica" };
  if (d.length > 15) return { mensaje: "Ese número tiene de más" };

  if (unSoloCaracter(d)) return { mensaje: "Ese no parece un número real" };
  if (esSecuencia(d)) return { mensaje: "Ese no parece un número real" };

  // Rellenos clásicos.
  const sinPais = d.replace(/^54(9)?/, "");
  if (/^0+$/.test(sinPais) || /^(12345|00000|11111|99999)/.test(sinPais)) {
    return { mensaje: "Ese no parece un número real" };
  }

  return null;
}

/* ————— Edad ————— */

export function validarEdad(valor: number): Problema | null {
  if (!Number.isFinite(valor)) return { mensaje: "Poné tu edad en números" };
  if (valor < 14) return { mensaje: "Revisá la edad" };
  if (valor > 110) return { mensaje: "Revisá la edad" };
  return null;
}

/* ————— Punto de entrada ————— */

/**
 * Valida según a qué campo de la ficha del cliente va a parar la respuesta.
 *
 * Se usa `maps_to` y no el tipo de pregunta porque lo que define el criterio es
 * el significado: un campo de texto que guarda el nombre necesita otra
 * validación que uno que guarda un comentario libre.
 */
export function validarRespuesta(mapsTo: string | null | undefined, valor: unknown): Problema | null {
  if (valor === null || valor === undefined || valor === "") return null;

  switch (mapsTo) {
    case "name":
      return validarNombre(String(valor));
    case "email":
      return validarEmail(String(valor));
    case "phone":
      return validarTelefono(String(valor));
    case "age":
      return validarEdad(Number(valor));
    default:
      return null;
  }
}
