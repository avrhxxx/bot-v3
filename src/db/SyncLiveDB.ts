export interface LiveRole {
  id: string;
  name: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  parentId?: string;
  type: string;
}

class SyncLiveDatabase {

  roles: Map<string, LiveRole> = new Map();
  channels: Map<string, LiveChannel> = new Map();

  clear() {
    this.roles.clear();
    this.channels.clear();
  }

  setRole(role: LiveRole) {
    this.roles.set(role.id, role);
  }

  setChannel(channel: LiveChannel) {
    this.channels.set(channel.id, channel);
  }

  removeRole(roleId: string) {
    this.roles.delete(roleId);
  }

  removeChannel(channelId: string) {
    this.channels.delete(channelId);
  }

  getRoles(): LiveRole[] {
    return Array.from(this.roles.values());
  }

  getChannels(): LiveChannel[] {
    return Array.from(this.channels.values());
  }
}

export const SyncLiveDB = new SyncLiveDatabase();
