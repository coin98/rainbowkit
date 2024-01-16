---
"@rainbow-me/rainbowkit": patch
---

Add ramper wallet support

**Example usage**

```ts
import {
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { ramperWallet } from "@rainbow-me/rainbowkit/wallets";
const { wallets } = getDefaultWallets({ appName, chains });
const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [ramperWallet({ projectId, chains })],
  },
]);
```
