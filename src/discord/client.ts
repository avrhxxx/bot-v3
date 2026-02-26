export type ClientStub = {
  on(event: string, listener: (...args: any[]) => void): void;
  login(): Promise<string>;
  dispatch(): void;
  users: { cache: Map<any, any> };
};

export async function startDiscord(): Promise<ClientStub> {
  console.log('Discord stub started.');
  return {
    on: () => {},
    login: async () => 'ok',
    dispatch: () => {},
    users: { cache: new Map() },
  };
}