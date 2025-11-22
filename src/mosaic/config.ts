import type { SealKeyServer } from "./types";

export function useMosaicConfig() {
  const mosaicPackageId =
    "0xf6012255c72bec20d66d825398a49bc6cf64391e80573c52073ee809880c6fb0";
  const sealServers: SealKeyServer[] = [
    {
      objectId:
        "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
      url: "https://seal-key-server-testnet-1.mystenlabs.com",
    },
    {
      objectId:
        "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
      url: "https://seal-key-server-testnet-2.mystenlabs.com",
    },
  ];
  return { mosaicPackageId, sealServers };
}

export const MOSAIC_TAGLINE = "Every attendee is a piece of the picture.";
