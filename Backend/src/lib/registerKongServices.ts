import axios from "axios";

// Use Docker Compose service name for Kong instead of localhost
const KONG_ADMIN_URL = "http://kong:8001"; // Kong Admin API URL inside Docker network

//const BACKEND_API_URL = "http://host.docker.internal:5000"; // Your backend API for wind..

const BACKEND_API_URL = "http://backend:5000"; //for linux


// List of services to register
const services = [
  {
    name: "backend-api",
    url: BACKEND_API_URL,
    routes: ["/api"],
  },
];

async function registerService(service: { name: string; url: string; routes: string[] }) {
    try {
      // Check if the service exists
      const existingService = await axios.get(`${KONG_ADMIN_URL}/services/${service.name}`);
      if (existingService.data) {
        console.log(`ℹ Service already exists: ${service.name}`);
      }
    } catch (err) {
      // If the service doesn't exist, err.response.status might be 404
      if (err.response && err.response.status === 404) {
        // Register Service
        await axios.post(`${KONG_ADMIN_URL}/services`, {
          name: service.name,
          url: service.url,
        });
        console.log(`✔ Service Registered: ${service.name}`);
      } else {
        console.error(`❌ Error checking service ${service.name}:`, err.response?.data || err.message);
        return;
      }
    }
  
    // Register Routes
    try {
      // You can also check for routes here if necessary
      for (const route of service.routes) {
        await axios.post(`${KONG_ADMIN_URL}/services/${service.name}/routes`, {
          paths: [route],
        });
        console.log(`✔ Route Registered: ${route} → ${service.name}`);
      }
    } catch (error) {
      console.error(
        `❌ Error registering route for ${service.name}:`,
        error.response?.data || error.message
      );
    }
  }
  

async function setupKong() {
  console.log("🔄 Setting up Kong services...");
  for (const service of services) {
    await registerService(service);
  }
  console.log("✅ Kong setup completed.");
}

setupKong();
