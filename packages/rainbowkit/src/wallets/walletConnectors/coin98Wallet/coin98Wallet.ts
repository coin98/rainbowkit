/* eslint-disable sort-keys-fix/sort-keys-fix */
import type { InjectedConnectorOptions } from '@wagmi/core/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Chain } from '../../../components/RainbowKitProvider/RainbowKitChainContext';
import { getWalletConnectUri } from '../../../utils/getWalletConnectUri';
import { InstructionStepName, Wallet } from '../../Wallet';
import { getWalletConnectConnector } from '../../getWalletConnectConnector';
import type {
  WalletConnectConnectorOptions,
  WalletConnectLegacyConnectorOptions,
} from '../../getWalletConnectConnector';

declare global {
  interface Window {
    coin98Wallet: Window['ethereum'];
  }
}

export interface Coin98WalletLegacyOptions {
  projectId?: string;
  chains: Chain[];
  walletConnectVersion: '1';
  walletConnectOptions?: WalletConnectLegacyConnectorOptions;
}

export interface Coin98WalletOptions {
  projectId: string;
  chains: Chain[];
  walletConnectVersion?: '2';
  walletConnectOptions?: WalletConnectConnectorOptions;
}

function getCoin98WalletInjectedProvider(): Window['ethereum'] {
  const isCoin98Wallet = (ethereum: NonNullable<Window['ethereum']>) => {
    // Identify if Coin98 Wallet injected provider is present.
    const coin98Wallet = !!ethereum.isCoin98;

    return coin98Wallet;
  };

  const injectedProviderExist =
    typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // No injected providers exist.
  if (!injectedProviderExist) {
    return;
  }

  // Coin98 Wallet injected provider is available in the global scope.
  // There are cases that some cases injected providers can replace window.ethereum
  // without updating the ethereum.providers array. To prevent issues where
  // the C98 connector does not recognize the provider when C98 extension is installed,
  // we begin our checks by relying on C98's global object.
  if (window['coin98Wallet']) {
    return window['coin98Wallet'];
  }

  // Coin98 Wallet was injected into window.ethereum.
  if (isCoin98Wallet(window.ethereum!)) {
    return window.ethereum;
  }

  // Coin98 Wallet provider might be replaced by another
  // injected provider, check the providers array.
  if (window.ethereum?.providers) {
    // ethereum.providers array is a non-standard way to
    // preserve multiple injected providers. Eventually, EIP-5749
    // will become a living standard and we will have to update this.
    return window.ethereum.providers.find(isCoin98Wallet);
  }
}

export const coin98Wallet = ({
  chains,
  projectId,
  walletConnectOptions,
  walletConnectVersion = '2',
  ...options
}: Coin98WalletOptions & InjectedConnectorOptions): Wallet => {
  const isCoin98WalletInjected = Boolean(getCoin98WalletInjectedProvider());
  const shouldUseWalletConnect = !isCoin98WalletInjected;

  return {
    id: 'coin98',
    name: 'Coin98 Wallet',
    iconUrl: async () => (await import('./coin98Wallet.svg')).default,
    // Note that we never resolve `installed` to `false` because the
    // Coin98 Wallet provider falls back to other connection methods if
    // the injected connector isn't available
    installed: isCoin98WalletInjected || undefined,
    iconAccent: '#CDA349',
    iconBackground: '#fff',
    downloadUrls: {
      android:
        'https://play.google.com/store/apps/details?id=coin98.crypto.finance.media',
      ios: 'https://apps.apple.com/vn/app/coin98-super-app/id1561969966',
      mobile: 'https://coin98.com/wallet',
      qrCode: 'https://coin98.com/wallet',
      chrome:
        'https://chrome.google.com/webstore/detail/coin98-wallet/aeachknmefphepccionboohckonoeemg',
      browserExtension: 'https://coin98.com/wallet',
    },
    createConnector: () => {
      const getUriMobile = async () => {
        const uri = await getWalletConnectUri(connector, walletConnectVersion);

        return `coin98://wc?uri=${encodeURIComponent(uri)}`;
      };

      const getUriQR = async () => {
        const uri = await getWalletConnectUri(connector, walletConnectVersion);

        return uri;
      };

      const connector = shouldUseWalletConnect
        ? getWalletConnectConnector({
            projectId,
            chains,
            version: walletConnectVersion,
            options: walletConnectOptions,
          })
        : new InjectedConnector({
            chains,
            options: {
              name: 'Coin98 Wallet',
              shimChainChangedDisconnect: true,
              getProvider: getCoin98WalletInjectedProvider,
              ...options,
            },
          });

      const mobileConnector = {
        getUri: shouldUseWalletConnect ? getUriMobile : undefined,
      };

      let qrConnector = undefined;

      if (shouldUseWalletConnect) {
        qrConnector = {
          getUri: getUriQR,
          instructions: {
            learnMoreUrl: 'https://coin98.com/',
            steps: [
              {
                description:
                  'Put Coin98 Wallet on your home screen for faster access to your wallet.',
                step: 'install' as InstructionStepName,
                title: 'Open the Coin98 Wallet app',
              },
              {
                description: 'Create a new wallet or import an existing one.',
                step: 'create' as InstructionStepName,
                title: 'Create or Import a Wallet',
              },
              {
                description:
                  'Choose Wallet Connect, then scan the QR code and confirm the prompt to connect.',
                step: 'scan' as InstructionStepName,
                title: 'Tap WalletConnect in Widget',
              },
            ],
          },
        };
      }

      const extensionConnector = {
        instructions: {
          learnMoreUrl: 'https://coin98.com/wallet',
          steps: [
            {
              description:
                'Click at the top right of your browser and pin Coi98 Wallet for easy access.',
              step: 'install' as InstructionStepName,
              title: 'Install the Coin98 Wallet extension',
            },
            {
              description: 'Create a new wallet or import an existing one.',
              step: 'create' as InstructionStepName,
              title: 'Create or Import a wallet',
            },
            {
              description:
                'Once you set up Coin98 Wallet, click below to refresh the browser and load up the extension.',
              step: 'refresh' as InstructionStepName,
              title: 'Refresh your browser',
            },
          ],
        },
      };

      return {
        connector,
        mobile: mobileConnector,
        qrCode: qrConnector,
        extension: extensionConnector,
      };
    },
  };
};
