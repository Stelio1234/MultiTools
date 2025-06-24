/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const resend = new Resend(functions.config().resend.key);

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev", // or your verified sender
      to: user.email,
      subject: "🎉 Welcome to MultiTools!",
      html: `
        <h1>Welcome to MultiTools!</h1>
        <p>Hey ${user.displayName || "there"},</p>
        <p>Thanks for making an account with us. If you have any questions, feel free to reach out!</p>
        <p><a href="https://www.themultitools.xyz">Start Using Tools</a></p>
      `,
    });
    console.log("✅ Welcome email sent!");
  } catch (error) {
    console.error("🔥 Email send error:", error);
  }
});


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
