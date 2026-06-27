# Socivexa Mobile App (React Native + Expo)

Welcome to the mobile gate and resident terminal for the **Socivexa** platform (*Smart Society Living, Simplified.*).

This mobile application is built using **React Native**, **Expo**, **TypeScript**, and **React Navigation**. It connects to the existing ASP.NET Core backend API to handle resident dashboards, security gate operations, visitor check-ins, live listings, and complaints.

---

## Folder Structure

```
society-management-mobile/
├── src/
│   ├── api/             # Axios client configuration with JWT & X-Society-Id headers
│   ├── config/          # Environment configuration
│   ├── contexts/         # Authentication context (SecureStore based JWT persistence)
│   ├── navigation/      # Navigation configurations (Auth, Resident, Security stacks)
│   ├── components/      # Reusable styled UI elements (AppButton, AppInput, StatusBadge, etc.)
│   ├── screens/         # Screens (Login, Resident Dashboard, Complaints, Security, Visitor Entry)
│   ├── services/        # Service layer grouping backend API integrations
│   ├── types/           # Strong type definitions mapping domain models
│   └── utils/           # Helper scripts (Date formatters, Auth Events)
├── .env                 # API Base URL configuration
├── app.json             # Expo configuration (Cleartext traffic permission, android options)
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Install **Node.js** (v18 or higher recommended)
- Install the **Expo Go** application on your physical Android/iOS test device from the Google Play Store or Apple App Store.

### 2. Installation
Navigate to the mobile directory and install dependencies:
```bash
cd mobile/society-management-mobile
npm install
```

### 3. Environment Setup
Create or update the `.env` file in the root of the mobile folder:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.101:8001/api/
```
> **Warning**: Never use `localhost` or `127.0.0.1` because the mobile device or emulator will refer to itself. Always configure the local network IP address of your machine running the ASP.NET Core API.

---

## Local Testing Requirements

For the mobile app to communicate successfully with your local IIS / IIS Express server:

### A. Physical Device (Testing via Expo Go)
1. **Same Wi-Fi**: Both your development laptop and physical mobile device must be connected to the **same Wi-Fi network**.
2. **Firewall Access**: Ensure that Windows Defender Firewall allows incoming connections on the API port (e.g. `8001`). 
   - You can add an inbound rule allowing TCP port `8001` or temporarily disable firewall rules for local networks during E2E verification.
3. **Local IP Address**: Ensure the IP address matches your developer machine's internal network IP (e.g., `192.168.0.101` or similar).

### B. Android Emulator (AVD)
- If you are running the app inside an Android Emulator on the same computer hosting the API, you can use the loopback IP:
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8001/api/
  ```
  *(10.0.2.2 is mapped by the Android emulator to the host computer's loopback interface).*

---

## Running the Application

Start the Expo development server:
```bash
npm run start
```
Or run directly focusing on Android:
```bash
npm run android
```

### Accessing the App
1. Once the terminal starts, a **QR Code** will be printed.
2. Open the **Expo Go** app on your Android device.
3. Tap **"Scan QR Code"** and scan the code shown in the terminal.
4. The JavaScript bundle will compile and download onto your mobile device, loading the login interface.

---

## Production / APK Creation

To generate a standalone `.apk` package later:

1. **Production Base URL**: Replace the `.env` variable or build profile with the public HTTPS URL of your deployed Socivexa web API.
2. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
3. **Log in to Expo**:
   ```bash
   eas login
   ```
4. **Configure Project**:
   ```bash
   eas project:init
   ```
5. **Build Standalone Android APK**:
   Run the build command:
   ```bash
   eas build --platform android --profile preview
   ```
   *(Ensure your `eas.json` is configured to target `"apk"` build output format for distribution/direct installs).*
