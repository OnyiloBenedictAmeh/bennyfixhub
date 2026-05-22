const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// 🔥 CREATE TECHNICIAN FUNCTION
exports.createTechnician = onCall(async (request) => {
  const { data, auth } = request;

  // 🔐 Check if user is logged in
  if (!auth) {
    throw new Error("Unauthorized");
  }

  // 🔍 Get caller (admin) data
  const callerDoc = await admin.firestore()
    .collection("users")
    .doc(auth.uid)
    .get();

  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== "admin") {
    throw new Error("Only admin can create technician");
  }

  const { name, email, password } = data;

  if (!name || !email || !password) {
    throw new Error("Missing fields");
  }

  // 🔧 Create Auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: name,
  });

  // 🗂 Save to Firestore
  await admin.firestore()
    .collection("users")
    .doc(userRecord.uid)
    .set({
      name,
      email,
      role: "technician",
    });

  return { success: true };
});