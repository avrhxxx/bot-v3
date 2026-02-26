/**
 * Minimalny Discord client stub do buildu w Railway
 */
export async function startDiscord(): Promise<ClientStub> {
  console.log("Discord stub started.");

  const client: ClientStub = {
    on: () => {},               // obsługa eventów
    login: async () => "ok",    // login stub
    users: { cache: new Map() }, 
    dispatch: () => {},         // jeśli wywołujesz dispatch w kodzie
  };

  return client;
}

// Minimalny typ klienta
export type ClientStub = {
  on(event: string, listener: (...args: any[]) => void): void;
  login(): Promise<string>;
  users: { cache: Map<any, any> };
  dispatch(): void;
};