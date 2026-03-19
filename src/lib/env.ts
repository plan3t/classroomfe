function readBooleanEnv(value: string | undefined) {
  return value === '1' || value === 'true';
}

export const featureFlags = {
  nfcJoin: readBooleanEnv(process.env.NEXT_PUBLIC_ENABLE_NFC),
};
