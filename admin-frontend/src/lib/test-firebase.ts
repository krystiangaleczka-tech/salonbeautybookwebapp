import { auth } from "./firebase";

export function testFirebase() {
  console.log("Firebase auth object:", auth);
  console.log("Firebase config:", auth.config);
  console.log("Current user:", auth.currentUser);
  return {
    auth: !!auth,
    config: !!auth.config,
    currentUser: auth.currentUser
  };
}