import express, { type Request, type Response } from "express";
import cors from "cors";
import * as uuid from "uuid";

import { workflow } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "./sendMessage";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

app.post("/mail", (req, res) => {
  console.log("Received mail request");

  console.log(req.body);

  const str = req.body.from;
  const regex = /<([^>]+)>/;
  const match = str.match(regex);

  const response = {
    message: "Mail recibido, gracias por estar en contacto",
    to: match[1],
    subject: req.body.subject,
  };

  res.json(response);
});

app.get("/webhook", (req, res) => {
  console.log("Received webhook request");
  console.log(req.query);
  console.log(req.body);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Asegúrate de usar el mismo token aquí
      console.log("Webhook verified");
      res.status(200).send(challenge); // Envía el challenge de vuelta
    } else {
      res.sendStatus(403); // Token incorrecto
    }
  }
});

app.post("/webhook", async (req, res): Promise<any> => {
  const body = req.body;
  console.log("Received webhook POST request");

  if (body.source === "whatsapp") {
    const message = body.query;
    const thread_id = body.from;
    try {
      const response = await workflow.invoke(
        { messages: [new HumanMessage(message)] },
        { configurable: { thread_id } }
      );
      const responseMessage =
        response.messages[response.messages.length - 1].content;
      

      return res.status(200).json(responseMessage);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
      // throw new Error("Error al enviar mensaje: " + error.message);
    }
  }
  const is_echo = req.body.entry[0].messaging[0].message["is_echo"];
  // const is_echo = req.body.entry[0].changes[0].value.message["is_echo"];

  console.log("is_echo: " + is_echo);
  if (is_echo) {
    return res.sendStatus(200).send();
  }

  // Verifica que sea una notificación válida
  if (body.object === "instagram") {
    // Maneja los eventos aquí
    // con esta ruta manejamos los mensajes que llegan a la página de facebook "req.body.entry[0].changes[0] "
    // DE ESTA MANERA FUNCIONABA ANTES

    const senderId = req.body.entry[0].messaging[0].sender.id;
    const recipientId = req.body.entry[0].messaging[0].recipient.id;
    const message = req.body.entry[0].messaging[0].message.text;

    const thread_id = senderId;

    if (!message) return res.sendStatus(200);

    // Enviar al agente

    const config = {
      configurable: { thread_id },
      streamMode: "values" as const,
    };

    for await (const event of await workflow.stream(
      {
        messages: [new HumanMessage(message)],
      },
      config
    )) {
      const recentMsg = event.messages[event.messages.length - 1];
      if (recentMsg._getType() === "ai") {
        if (recentMsg === null) return;
        if (recentMsg.content !== null && recentMsg.content !== "") {
          try {
            sendMessage({ senderId, recipientId, message: recentMsg.content });
          } catch (e) {
            console.log(e);
          }
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED"); // Responde a Facebook
  } else {
    res.sendStatus(404);
  }
});

// fetch("http://localhost:3000/mail", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     key: "foo",
//   }),
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
