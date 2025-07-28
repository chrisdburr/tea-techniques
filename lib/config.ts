export const config = {
  basePath: process.env.NODE_ENV === 'production' ? '/tea-techniques' : '',
};

export function getAssetPath(path: string): string {
  return `${config.basePath}${path}`;
}
