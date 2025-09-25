export const config = {
  basePath: '/tea-techniques',
};

export function getAssetPath(path: string): string {
  return `${config.basePath}${path}`;
}
