export type ClientStub = { login(): Promise<string> };

export async function startDiscord(): Promise<ClientStub> {
  console.log('[Discord] Stub client started');
  return { login: async () => 'ok' };
}