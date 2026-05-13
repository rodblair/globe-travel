# Globe Travel Mobile

Expo mobile app for the Globe.travel trip-planning experience. The app keeps the existing web client intact and ports the core mobile flow into React Native: Trip Studio, saved itinerary maps, and a crew prompt composer.

## Run

```bash
cd mobile
npm run ios
```

Other targets:

```bash
npm run android
npm run web
```

## Connect To The Web API

The mobile app calls the existing Next.js API routes from `client/`. Start the web client in another terminal:

```bash
cd client
npm run dev
```

Then point Expo at the web server when needed:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 npm run ios
```

For Android emulator, use `http://10.0.2.2:3000`. For a physical phone, use your Mac's LAN address, for example `http://192.168.1.20:3000`.
