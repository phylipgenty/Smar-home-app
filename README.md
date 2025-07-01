# Smart Home App

A React Native smart home automation app with dual roles (resident/caretaker), modern UI design, WebSocket connectivity, and Bluetooth support.

## Features

- 🏠 **Dual Role System**: Resident and Caretaker interfaces
- 📱 **Modern UI**: Built with React Native Paper
- 🔌 **WebSocket Integration**: Real-time communication with PC
- 📶 **Bluetooth Support**: HC-05 Arduino control
- 🎨 **Navigation**: React Navigation v6 with stack and tab navigation
- 💾 **Local Storage**: AsyncStorage for data persistence

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start Metro bundler: `npm start`
4. Run on Android: `npm run android`

## Building APK

The project includes GitHub Actions workflow that automatically builds APK files on push to main branch.

## Architecture

- **Authentication Context**: User role management
- **Socket Context**: WebSocket communication
- **Bluetooth Context**: Device connectivity
- **Theme**: Consistent UI styling

## Screens

- Login
- Resident Dashboard
- Caretaker Dashboard
- Device Control
- Chat
- Alerts
- Settings
