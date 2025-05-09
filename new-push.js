const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./service-account-firebase.json"); // Archivo con las credenciales del firebase

// Inicializa Firebase Admin (si no está inicializado)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class NewsPushJob {
  constructor(news, recipients) {
    this.news = news;
    this.recipients = recipients;
    this.tries = 3;
  }

  async handle() {
    try {
      const author = this.news.author.detail.pushDisplayName();
      const role = `(${this.news.author.role.nombre})`;
      const sender = `${author} ${role}`;

      // Configuración de la notificación
      const notification = {
        body: `Tienes un mensaje de ${sender}`,
        title: "Nuevo mensaje en WebClass",
      };

      const content = {
        click_action: "REDIRECT_TO_NEWS_DETAIL",
        status: "done",
        id: String(this.news.id),
      };

      const message = {
        token: this.recipients,
        notification: notification,
        data: content,
      };

      // Envía la notificación
      const response = await admin.messaging().send(message);
      console.log("Notificación enviada:", response);

      return response;
    } catch (error) {
      console.error("Error al enviar notificación:", error.message, error.code);
      throw error; // Para manejo de reintentos
    }
  }
}

// Ejemplo de uso:
async function testJob() {
  const mockNews = {
    id: 123,
    author: {
      detail: {
        pushDisplayName: () => "Juan Pérez",
      },
      role: {
        nombre: "Profesor",
      },
    },
  };

  const recipients = "cRyOlJ3ERqKyGGCaLUPSJy:APA91bFo7YQxy5nmeqwTnW_J4HSoeWrs"; // Reemplazar con token real

  const job = new NewsPushJob(mockNews, recipients);
  await job.handle();
}

testJob().catch(console.error);
