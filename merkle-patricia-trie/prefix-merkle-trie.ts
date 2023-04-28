import * as crypto from "crypto";


class TrieNode {
    value: string|null = null;
    path: string|null = null;
    children: TrieNode[]|null = null;
    hash : string|null = null;
}

class Trie {

    head : TrieNode
    constructor() {

        // head always has path and value set to null, but children is set to an empty array initially.
        // nodes have path set but value can be null or non null and children set to an empty array initially
        // leaves have their paths and value params set but children set to null

        this.head = new TrieNode();
        this.head.children = new Array<TrieNode>();
    }

    private async sha256(digest: string) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(digest));
        return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    }

    //@ts-ignore
    private async _insert(node: TrieNode, key: string, value: string): Promise<string> {

        if(key.length === 0 ){

            console.assert(node.children === null, "leaf node must have the children parameter set to null");
            node.value = value;
            node.hash = await this.sha256(node.value);
            return node.hash
        }

        if(key.length !== 0) {

            if(node.children ===  null) {
                node.children = new Array<TrieNode>();
            }

            let digest = "";

            let childFoundFlag = null
            for(let child of node.children) {
                
                if(child.path === key[0]) {
                    childFoundFlag = child;
                    //@ts-ignore
                    digest = await this._insert(child, key.slice(1), value);

                    //post-order traversal
                    for(let child of node.children) {
                        if(child !== childFoundFlag) {
                            digest = digest + child.hash;
                        }
                    }
            
                    node.hash = await this.sha256(digest);
                }
            }


            if(!childFoundFlag) {
                let newChild = new TrieNode();
                newChild.path = key[0];
                node.children.push(newChild);
                digest = await this._insert(newChild, key.slice(1), value);

                //post-order traversal
                for(let child of node.children) {
                    if(child !== newChild) {
                        digest = digest + child.hash;
                    }
                }
            
                node.hash = await this.sha256(digest);
            }

            //@ts-ignore
            return node.hash;
        }
    }

    async insert(key: string, value: string) {
        await this._insert(this.head, key, value)
    }

    //@ts-ignore
    private _get(node: TrieNode, key: string): string|null {

        console.assert(key.length > 0, "can never have empty key");

        if(node.children === null && key.length > 0) {
            //follow key does not exist in the trie.
            return null
        }

        if(key.length === 1 && node.children !== null) {
            
            let leafNode = node.children.find((child: TrieNode)=> {
                return child.path === key;
            });

            if(leafNode) {
                console.assert(leafNode.value !== null, "no value exists for the key present in the trie");
                return leafNode.value;
            } else {
                return null
            }
        }

        if(key.length > 1 && node.children !== null) {

            let childFoundFlag = false
            for(let child of node.children) {
                if(child.path = key[0]) {
                    childFoundFlag = true;
                    return this._get(child, key.slice(1))
                }
            }

            if(!childFoundFlag) {
                return null;
            }
        }
    }

    get(key: string) {

        return this._get(this.head, key);
    }
}

(async function() {

    let t = new Trie();

    await t.insert("art", "0x1");
    await t.insert("arm","0x2");
    await t.insert("avg", "0x3");
    await t.insert("arti", "0x4");

    //@ts-ignore
    console.log(JSON.stringify(t.head.children[0], null, 4));
    //console.log("get :", t.get("arti"));
    //console.log("get :", t.get("ar"));
})();


