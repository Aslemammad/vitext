declare module '/@vitext/*';

interface Window extends Window {
  __DATA: Record<string, any>;
}
