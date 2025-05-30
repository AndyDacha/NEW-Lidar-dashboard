export interface User {
  username: string;
  password: string;
  role: 'admin' | 'user';
}

export const users: User[] = [
  {
    username: 'Dacha2025LIDAR',
    password: 'D4ch4LIDARLAR4337$',
    role: 'admin'
  },
  {
    username: 'DavidC',
    password: 'D4v1dL1D4R2024$',
    role: 'user'
  },
  {
    username: 'ScottS',
    password: 'Sc0ttL1D4R2024$',
    role: 'user'
  },
  {
    username: 'SteveW',
    password: '5y48thjferiur435£',
    role: 'user'
  }
]; 