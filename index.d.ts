interface BlockObject {
    start: number;
    end: number;
    hash: string;
    order: number;
}
export declare function createBlocks(filePath: string, size: number): Promise<{
    hash: string;
    blocks: BlockObject[];
}>;
export default createBlocks;
