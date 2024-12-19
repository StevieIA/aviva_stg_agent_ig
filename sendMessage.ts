export const access_token = "";

// export const sendMessage = async ({ recipientId, senderId, message }) => {
//   const response = await fetch(
//     `https://graph.instagram.com/v21.0/${recipientId}/messages`,
//     {
//       method: "POST",
//       headers: {
//         Authorization:
//           "Bearer IGAAGnB3WeI6lBZAE5iMkJFdzNHa1h3LXp6QkFja2dvRml3TnUwZAFZAQMlBxOTZADSmFENUg1bENqa0tRUE1HeHhuU3Y4OEVTTk94VDIzOU43WWxNX2VWbUlTczBOU2U4TWxrYWZATSHN2eXA0bHI3SkVnLU5vUVpqVC1nNnZAhZA21TRQZDZD",

//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         recipient: {
//           id: senderId,
//         },
//         message: {
//           text: message,
//         },
//       }),
//     }
//   );
//   const res = await response.json();
//   console.log(res);
// };

type SendMessageParams = {
  recipientId: string;
  senderId: string;
  message: string;
};

export const sendMessage = async ({
  recipientId,
  senderId,
  message,
}: SendMessageParams) => {
  // Validación de parámetros
  if (!recipientId || !senderId || !message) {
    console.error(
      "Parámetros inválidos: recipientId, senderId y message son requeridos."
    );
    return { error: "Parámetros inválidos." };
  }

  // Access token prod cuenta aviva INSTAGRAM_ACCESS_TOKEN
  // Access token dev cuenta aviva INSTAGRAM_ACCESS_TOKEN_AVIVA_CUENTA_MARIANO
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN; // Usa variables de entorno

  const url = `https://graph.instagram.com/v21.0/${recipientId}/messages`;

  try {
    // Llamada a la API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: message },
      }),
    });

    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error en la API de Instagram:", errorData);
      return { error: "La API devolvió un error.", details: errorData };
    }

    // Procesar la respuesta
    const resData = await response.json();
    console.log("Mensaje enviado con éxito:", resData);
    return resData;
  } catch (error: any) {
    // Captura errores de red o excepciones
    console.error("Error al enviar el mensaje:", error.message);
    return { error: "Error de red o del servidor.", details: error.message };
  }
};
