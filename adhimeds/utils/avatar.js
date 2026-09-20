// utils/avatar.js
export const buildAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;

  let normalized = avatarPath;
  if (!avatarPath.startsWith('/imgUploads/')) {
    normalized = `/imgUploads/${avatarPath}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
  return `${baseUrl}${normalized}`;
};