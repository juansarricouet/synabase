/**
 * Los artículos del blog.
 *
 * Cada uno desarrolla una de las preguntas frecuentes de la portada. Ahí la
 * respuesta entra en tres líneas; acá se contesta en serio, que es lo que
 * busca alguien que todavía está decidiendo.
 *
 * El título no repite la pregunta: usa las palabras con las que un comercio
 * buscaría el tema. La pregunta original queda igual en `question`, porque es
 * la que la gente escribe tal cual.
 *
 * Es contenido público y común para todos, así que vive en un archivo y no en
 * la base: no hay nada que cada comercio personalice.
 */

export interface Section {
  h: string;
  p: string[];
  ul?: string[];
}

export interface Article {
  slug: string;
  category: string;
  title: string;
  /** Bajada de la tarjeta y descripción para buscadores. */
  description: string;
  /** La pregunta frecuente que responde, tal como la escribe la gente. */
  question: string;
  /** Respuesta corta, arriba de todo: quien vino apurado se va con esto. */
  answer: string;
  sections: Section[];
}

export const ARTICLES: Article[] = [
  {
    slug: "encuesta-con-qr-sin-app",
    category: "Fundamentos",
    title: "Encuestas por QR sin app: qué hace el cliente y qué hacés vos",
    description:
      "Qué pasa desde que alguien apunta la cámara hasta que sus datos quedan en tu base, y por qué no hay nada que instalar.",
    question: "¿Mis clientes tienen que bajarse una app?",
    answer:
      "No. El cliente apunta la cámara del celular al QR, se abre una página web común, responde y listo. No instala nada, y vos tampoco.",
    sections: [
      {
        h: "Qué pasa cuando alguien escanea",
        p: [
          "Desde iPhone y desde Android, la cámara reconoce un QR sin abrir ninguna aplicación aparte. Aparece un aviso arriba de la pantalla, la persona lo toca y se abre el navegador que ya tiene.",
          "Lo que ve es una página preparada para el celular: una pregunta por pantalla, letra grande y un botón para avanzar. No hay que registrarse, ni poner contraseña, ni confirmar un mail para entrar.",
        ],
      },
      {
        h: "Por qué importa que no haya app",
        p: [
          "Cada paso que agregás pierde gente. Pedirle a alguien que está esperando la cuenta que baje una aplicación, cree un usuario y espere a que descargue es perder a la mayoría en el camino.",
          "El QR funciona porque el esfuerzo es casi cero: apuntar la cámara y responder tres preguntas. Ese es todo el trato, y por eso se completa.",
        ],
      },
      {
        h: "Qué necesitás vos",
        p: [
          "Del lado del comercio tampoco hay instalación. Se crea la cuenta desde el navegador, se eligen las preguntas y se descarga el QR listo para imprimir en PNG, SVG o PDF.",
          "El PDF viene en tamaño de cartel para pegar en la mesa, el mostrador o la vidriera. Con imprimirlo y pegarlo ya está funcionando.",
        ],
      },
    ],
  },
  {
    slug: "cuantas-preguntas-encuesta-local",
    category: "Guía",
    title: "Cuántas preguntas poner en la encuesta de tu local",
    description:
      "Cada pregunta que agregás hace que menos gente termine. Cuáles conviene hacer primero y cuáles pueden esperar.",
    question: "¿Cuánto tarda una persona en completar el formulario?",
    answer:
      "Alrededor de treinta segundos con tres preguntas. Conviene arrancar con pocas: cuantas menos, más gente la termina, y siempre se pueden agregar después.",
    sections: [
      {
        h: "La regla que no falla",
        p: [
          "Cada pregunta que sumás baja la cantidad de gente que llega al final. No es una idea: es lo que pasa con cualquier formulario, y en un local es peor porque la persona está haciendo otra cosa.",
          "Por eso conviene empezar corto y agregar después. Al revés no se puede: si arrancás pidiendo diez datos y completa poca gente, no vas a saber si el problema era el largo o el incentivo.",
        ],
      },
      {
        h: "Las tres con las que arrancar",
        p: [
          "Para una primera versión alcanza con esto:",
        ],
        ul: [
          "El nombre, para poder tratarla por su nombre después.",
          "El email o el teléfono, que es lo único imprescindible: sin una forma de contacto, la ficha no sirve para volver a escribirle.",
          "Qué consumió, que es el dato que después vale plata cuando querés saber qué se vende y a quién.",
        ],
      },
      {
        h: "Lo que puede esperar",
        p: [
          "La edad, el género, cómo te conoció y qué tan probable es que te recomiende son datos buenos, pero ninguno es urgente. Sumalos de a uno cuando veas que la gente está completando bien.",
          "Un caso aparte es pedir mail y teléfono juntos. Son dos campos de escritura seguidos y es donde más gente abandona. Si vas a contactar por mail, pedí sólo el mail.",
        ],
      },
      {
        h: "Cómo saber si te pasaste",
        p: [
          "Mirá la relación entre escaneos y respuestas. Si mucha gente escanea y pocos terminan, el formulario es largo o el incentivo es flojo. Sacá una pregunta y comparalo con la semana anterior.",
        ],
      },
    ],
  },
  {
    slug: "que-incentivo-ofrecer-qr",
    category: "Guía",
    title: "Qué ofrecer para que escaneen tu QR (no tiene que ser descuento)",
    description:
      "El descuento es el gancho más común, pero no el único. Alternativas que cuestan menos y funcionan igual.",
    question: "¿Y si no quiero dar descuento?",
    answer:
      "No hace falta. Podés usar un café de regalo, un sorteo mensual o puntos acumulables. Lo único que no puede faltar es un motivo claro para escanear.",
    sections: [
      {
        h: "Por qué tiene que haber algo",
        p: [
          "Nadie llena un formulario porque sí. La persona te está dando su nombre y su forma de contacto, y eso tiene un valor: si no recibe nada a cambio, no lo hace.",
          "El incentivo no es un costo perdido, es lo que pagás por el dato. Y a diferencia del dato, el descuento se usa una vez.",
        ],
      },
      {
        h: "Alternativas al porcentaje",
        p: ["Si no querés tocar el precio, hay opciones que salen menos y se perciben igual o mejor:"],
        ul: [
          "Un producto de regalo con la próxima compra: te cuesta el costo, no el precio de venta.",
          "Un sorteo mensual entre los que se registraron: el costo es fijo y no depende de cuánta gente escanee.",
          "Puntos o sellos digitales: el beneficio llega recién a la quinta visita, así que se paga solo.",
          "Acceso anticipado a algo: la carta nueva, una fecha con cupo, un evento.",
        ],
      },
      {
        h: "Lo que sí conviene cuidar",
        p: [
          "El beneficio tiene que entenderse en el cartel, sin letra chica. «5% de descuento» funciona porque se lee de un vistazo; «beneficios exclusivos para clientes» no le dice nada a nadie.",
          "Y tiene que poder usarse fácil. Si el cliente tiene que explicar en la caja qué es lo que ganó, la mitad no lo reclama y la próxima no escanea.",
        ],
      },
    ],
  },
  {
    slug: "de-quien-son-los-datos-de-tus-clientes",
    category: "Datos",
    title: "De quién son los datos de tus clientes",
    description:
      "Qué pasa con la información que cargás, quién puede verla y cómo llevártela si algún día dejás de usar el sistema.",
    question: "¿De quién son los datos que se cargan?",
    answer:
      "Tuyos. Cada comercio ve solamente su propia base, y podés exportarla entera a CSV, Excel o PDF cuando quieras. Si te vas, te llevás tu información.",
    sections: [
      {
        h: "Cada comercio ve lo suyo y nada más",
        p: [
          "La base está separada por comercio. Ninguna cuenta puede consultar los clientes de otra, ni por error ni buscando: cada consulta al sistema lleva pegado de qué comercio es, y esa marca sale de la sesión, no de algo que se pueda escribir desde afuera.",
        ],
      },
      {
        h: "Podés llevártelo cuando quieras",
        p: [
          "Desde «Base de datos → Exportar» sacás todo en CSV, Excel o PDF. No hay que pedirlo ni esperar a que alguien lo prepare.",
          "Conviene hacerlo cada tanto igual, aunque no pienses irte. Una copia propia de tu base es una buena costumbre con cualquier sistema, no sólo con este.",
        ],
      },
      {
        h: "Qué pasa si te pasás del plan",
        p: [
          "Nada le pasa a tus datos. Si superás el tope de clientes del plan gratuito, se siguen guardando todos y los seguís viendo y exportando.",
          "Lo que se limita son las herramientas —los segmentos, las campañas—, nunca la información. Esconder o borrar los clientes de un comercio para forzar un pago no corresponde: esos datos son de él y de su gente.",
        ],
      },
      {
        h: "Una responsabilidad que queda de tu lado",
        p: [
          "Los datos son tuyos, y eso incluye la parte incómoda: la gente te los dio para que vos les escribas, no para que aparezcan en otro lado. Si algún día vendés o cedés esa base, estás usando algo que te confiaron para otra cosa.",
        ],
      },
    ],
  },
  {
    slug: "varios-locales-un-qr-por-sucursal",
    category: "Operación",
    title: "Cómo medir varias sucursales con un QR para cada una",
    description:
      "Un QR por local te deja comparar sucursales sin mezclar los datos, y ver todo junto cuando lo necesitás.",
    question: "¿Sirve si tengo más de un local?",
    answer:
      "Sí. Podés generar un QR distinto por sucursal y ver los datos juntos o separados. El plan Business incluye varias sucursales y usuarios con permisos.",
    sections: [
      {
        h: "Un QR por lugar, no uno solo para todo",
        p: [
          "Si ponés el mismo QR en dos locales, la base se llena igual pero perdés la única pregunta que importa cuando tenés más de uno: cuál anda mejor y por qué.",
          "Con un QR por sucursal, cada respuesta queda asociada al lugar donde se escaneó. Ahí podés comparar de verdad: cuánta gente nueva entra en cada una, qué se consume en cada zona y en qué horarios.",
        ],
      },
      {
        h: "Lo que se ve al separar",
        p: ["Con los datos divididos por local aparecen cosas que juntos no se notan:"],
        ul: [
          "Una sucursal que capta muchos clientes nuevos pero no los hace volver.",
          "Otra con menos gente pero que gasta más por visita.",
          "Productos que funcionan en un barrio y no en otro.",
          "Horarios muertos que sólo pasan en un local, no en la marca entera.",
        ],
      },
      {
        h: "Quién ve qué",
        p: [
          "Podés invitar a alguien de cada local con su propio acceso, así ve lo que necesita para trabajar sin tocar la configuración del resto.",
        ],
      },
    ],
  },
  {
    slug: "base-de-clientes-sin-saber-de-tecnologia",
    category: "Guía",
    title: "Armar la base de clientes de tu local sin saber de tecnología",
    description:
      "Qué hay que hacer, en orden, desde que creás la cuenta hasta que el QR está pegado en la mesa.",
    question: "¿Necesito saber de tecnología para usarlo?",
    answer:
      "No. Creás la cuenta, elegís las preguntas, descargás el QR y lo imprimís. Está pensado para que lo use quien atiende, no un equipo de sistemas.",
    sections: [
      {
        h: "El orden de las cosas",
        p: ["Son cuatro pasos y se hacen una sola vez:"],
        ul: [
          "Crear la cuenta con tu mail y el nombre del comercio.",
          "Elegir las preguntas. Vienen unas puestas por defecto; podés sacar las que no te sirvan.",
          "Escribir el beneficio, que es lo que va a leer el cliente en el cartel.",
          "Descargar el QR e imprimirlo.",
        ],
      },
      {
        h: "Dónde pegarlo",
        p: [
          "Donde la persona ya está mirando y tiene el celular en la mano: la mesa, el mostrador junto a la caja, el reverso del ticket. En la vidriera funciona menos, porque quien pasa no se detiene.",
          "El cartel tiene que decir qué gana, no qué es. «Escaneá y llevate 10%» funciona; «sumate a nuestra base de datos» no lo escanea nadie.",
        ],
      },
      {
        h: "Qué mirar la primera semana",
        p: [
          "Sólo dos números: cuánta gente escanea y cuánta termina. Si escanean pocos, el cartel o el lugar están mal. Si escanean muchos y terminan pocos, el formulario es largo.",
          "Todo lo demás —segmentos, campañas, rankings— puede esperar a que tengas gente cargada. Sin datos no hay nada que analizar.",
        ],
      },
    ],
  },
  {
    slug: "recuperar-clientes-de-apps-de-delivery",
    category: "Delivery",
    title: "Cómo recuperar a los clientes que te compran por apps de pedidos",
    description:
      "Pagás comisión por gente que no podés volver a contactar. Un QR dentro del pedido cambia eso.",
    question: "¿Sirve para los pedidos que entran por aplicaciones?",
    answer:
      "Sí, y es donde más se nota. Poniendo un QR dentro del pedido, con su propio beneficio para la próxima visita, esos clientes pasan a estar en tu base y no sólo en la de la plataforma.",
    sections: [
      {
        h: "El problema de fondo",
        p: [
          "Cuando entra un pedido por una aplicación, vos ponés la cocina, el producto y el envase. La plataforma pone el cliente, cobra su comisión, y se queda con el nombre, el teléfono y la dirección.",
          "El resultado es que podés vender miles de pedidos y seguir sin poder escribirle a una sola de esas personas. Cada vez que querés que vuelvan, hay que pagar de nuevo.",
        ],
      },
      {
        h: "Qué cambia con un QR adentro del pedido",
        p: [
          "Impreso en el ticket o pegado en la bolsa, con un beneficio pensado para que vengan al local. La persona ya te compró, ya sabe que le gusta lo tuyo: es el momento con más chance de que te deje sus datos.",
          "Conviene que sea un QR aparte del que tenés en el salón, con sus propias preguntas y su propio beneficio. Al cliente de delivery no tiene sentido preguntarle a qué hora vino.",
        ],
      },
      {
        h: "Medir si funciona",
        p: [
          "Cada cliente queda marcado según por dónde entró, así podés ver cuántos venían de una aplicación, cuántos de esos después pisaron el local y cuánto gastan comparados con los de siempre.",
          "Ese es el número que justifica todo: cuántos clientes dejaron de ser de la plataforma para ser tuyos.",
        ],
      },
      {
        h: "Qué no esperar",
        p: [
          "No sirve para dejar de vender por aplicaciones de un día para el otro, y tampoco hace falta. La idea es que la segunda compra pueda entrar directo, no que cierres el canal que te trae gente nueva.",
        ],
      },
    ],
  },
];

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
