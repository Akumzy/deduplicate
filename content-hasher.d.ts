/// <reference types="node" />
import crypto from 'crypto';
declare class ContentHasher {
    overallHasher: crypto.Hash | null;
    blockHasher: crypto.Hash | null;
    blockPos: number;
    blocks: {
        start: number;
        end: number;
        hash: string;
        order: number;
    }[];
    totalChuck: number;
    addedNewBlock: boolean;
    order: number;
    constructor(overallHasher: crypto.Hash, blockHasher: crypto.Hash);
    update: (data: Buffer) => void;
    digest: (encoding: any, size?: number) => any;
    addBlock(buf: Buffer, size: number): void;
}
export declare function create(): ContentHasher;
export {};
