declare module '/@vitext/*';

interface Window extends Window {
  __DATA: {
    pageClientPath: string;
    props: Record<string,any>
  };
}
