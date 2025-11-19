declare module 'expo-asset' {
  export type AssetMetadata = {
    name: string;
    type: string;
    uri: string;
    width?: number;
    height?: number;
  };

  export class Asset {
    readonly downloaded: boolean;
    readonly localUri?: string;
    static fromModule(moduleId: number): Asset;
    static loadAsync(moduleIds: number | number[]): Promise<void>;
    downloadAsync(): Promise<void>;
    readonly width?: number;
    readonly height?: number;
    readonly name?: string;
    readonly type?: string;
  }
}
