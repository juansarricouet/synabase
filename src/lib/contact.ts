/**
 * Datos de contacto de SynapBase. Se usan en la landing (preguntas y contacto)
 * y en el pie de página.
 */

/**
 * Código de país para WhatsApp, sin el `+`.
 *
 * Argentina es `549`: el 54 del país más el 9 que WhatsApp exige para los
 * celulares. Si el link no abre el chat, casi siempre es por acá.
 */
const COUNTRY_CODE = "549";

/** Número sin código de país, sin espacios ni guiones. 2920 es Viedma. */
const LOCAL_NUMBER = "2920257395";

/** Número completo tal como lo espera wa.me. */
export const WHATSAPP_NUMBER = `${COUNTRY_CODE}${LOCAL_NUMBER}`;

/** Cómo se muestra el número en pantalla. */
export const WHATSAPP_DISPLAY = "+54 9 2920 25-7395";

/** Texto que aparece ya escrito en el chat cuando abren el link. */
export const WHATSAPP_MESSAGE = "¡Hola! Vi SynapBase y quería hacerles una consulta.";

/** Link directo al chat, con el mensaje precargado. */
export const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CONTACT_EMAIL = "juansarricouet@gmail.com";

/** Asunto precargado del mail, para que las consultas lleguen identificadas. */
export const EMAIL_SUBJECT = "Consulta sobre SynapBase";

export const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}`;
