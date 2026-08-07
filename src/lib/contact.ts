/**
 * Datos de contacto del comercio que vende SynapBase.
 *
 * ⚠️ REEMPLAZAR `WHATSAPP_NUMBER` por el número real antes de publicar.
 *
 * Formato: código de país + área + número, sin `+`, sin espacios y sin guiones.
 * Para un celular argentino hay que incluir el 9 después del 54.
 *   +54 9 11 5555-0100  →  "5491155550100"
 */
export const WHATSAPP_NUMBER = "5491100000000";

/** Texto que aparece ya escrito en el chat cuando abren el link. */
export const WHATSAPP_MESSAGE = "¡Hola! Vi SynapBase y quería hacerles una consulta.";

/** Cómo se muestra el número en pantalla. */
export const WHATSAPP_DISPLAY = "+54 9 11 0000-0000";

/** Link directo al chat, con el mensaje precargado. */
export const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CONTACT_EMAIL = "hola@synapbase.app";
