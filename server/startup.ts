import { storage } from "./storage";

const MOCK_USER_ID = "mock-user-123";

export async function initializeApplication() {
  try {
    // Check if mock user exists
    const existingUser = await storage.getUser(MOCK_USER_ID);
    
    if (!existingUser) {
      // Create mock user for demo purposes
      await storage.createUser({
        username: "demo-user",
        password: "demo-password" // In a real app, this would be hashed
      });
      console.log("Mock user created successfully");
    } else {
      console.log("Mock user already exists");
    }
  } catch (error) {
    console.error("Error initializing application:", error);
  }
}