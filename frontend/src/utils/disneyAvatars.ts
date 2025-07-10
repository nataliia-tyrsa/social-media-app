// Disney avatars (можно добавить свои)
export const DISNEY_AVATARS = [
  'https://i.imgur.com/1Q9Z1Zm.png', // Микки
  'https://i.imgur.com/2nCt3Sb.png', // Минни
  'https://i.imgur.com/3GvwNBf.png', // Дональд
  'https://i.imgur.com/4AiXzf8.png', // Гуфи
  'https://i.imgur.com/5QZnG6F.png', // Плуто
  'https://i.imgur.com/6QZnG6F.png', // Дейзи
  'https://i.imgur.com/7QZnG6F.png', // Чип
  'https://i.imgur.com/8QZnG6F.png', // Дейл
];

export function getDisneyAvatar(userIdOrName: string): string {
  if (!userIdOrName) return DISNEY_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < userIdOrName.length; i++) {
    hash = userIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DISNEY_AVATARS.length;
  return DISNEY_AVATARS[index];
} 