import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "",
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "0xf6012255c72bec20d66d825398a49bc6cf64391e80573c52073ee809880c6fb0",
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "",
    },
  },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
