declare module "next-pwa" {
  type PwaOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  };

  export default function withPWAInit<T extends object>(
    options: PwaOptions
  ): (nextConfig: T) => T;
}
