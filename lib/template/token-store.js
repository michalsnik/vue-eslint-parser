/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert")
const Token = require("./token")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = class TokenStore {
    /**
     * Initialize.
     */
    constructor() {
        this.tokens = []
        this.startMap = new Map()
        this.endMap = new Map()
    }

    /**
     * Add the given token.
     *
     * @param {Token} token - The token to be added.
     * @returns {void}
     */
    _add(token) {
        assert(token instanceof Token)
        assert(
            this.tokens.length === 0 ||
            token.start >= this.tokens[this.tokens.length - 1].end
        )

        const index = this.tokens.length

        this.tokens.push(token)
        this.startMap.set(token.start, index)
        this.endMap.set(token.end, index)
    }

    /**
     * Get the first token of the given node.
     *
     * @param {Node} node - The AST node to get.
     * @param {object} [options] - The option object.
     * @param {number} [options.skip=0] - The number of tokens you skip.
     * @param {number} [options.includeComments=false] - The flag to include comments.
     * @returns {Token|null} The found token.
     */
    getFirstToken(node, options) {
        assert(this.startMap.has(node.start))

        let skip = 0
        let includeComments = false

        if (typeof options === "number") {
            skip = options | 0
        }
        if (options !== null && typeof options === "object") {
            skip = options.skip | 0
            includeComments = Boolean(options.includeComments)
        }
        assert(skip >= 0)

        const offset = this.startMap.get(node.start)
        const tokens = this.tokens
        if (includeComments) {
            const i = offset + skip
            if (i < tokens.length && tokens[i].end <= node.end) {
                return tokens[i]
            }
        }
        else {
            for (let i = offset; i < tokens.length; ++i) {
                if (tokens[i].end > node.end) {
                    break
                }
                if (tokens[i].type === "Comment") {
                    continue
                }
                if (skip > 0) {
                    --skip
                    continue
                }

                return tokens[i]
            }
        }

        return null
    }

    /**
     * Get the last token of the given node.
     *
     * @param {Node} node - The AST node to get.
     * @param {object} [options] - The option object.
     * @param {number} [options.skip=0] - The number of tokens you skip.
     * @param {number} [options.includeComments=false] - The flag to include comments.
     * @returns {Token|null} The found token.
     */
    getLastToken(node, options) {
        assert(this.endMap.has(node.end))

        let skip = 0
        let includeComments = false

        if (typeof options === "number") {
            skip = options | 0
        }
        if (options !== null && typeof options === "object") {
            skip = options.skip | 0
            includeComments = Boolean(options.includeComments)
        }
        assert(skip >= 0)

        const offset = this.endMap.get(node.end)
        const tokens = this.tokens
        if (includeComments) {
            const i = offset - skip
            if (i >= 0 && tokens[i].start >= node.start) {
                return tokens[i]
            }
        }
        else {
            for (let i = offset; i >= 0; --i) {
                if (tokens[i].start < node.start) {
                    break
                }
                if (tokens[i].type === "Comment") {
                    continue
                }
                if (skip > 0) {
                    --skip
                    continue
                }

                return tokens[i]
            }
        }

        return null
    }

    /**
     * Get a token before the given node.
     *
     * @param {Node|Token} node - The AST node to get.
     * @param {object} [options] - The option object.
     * @param {number} [options.skip=0] - The number of tokens you skip.
     * @param {number} [options.includeComments=false] - The flag to include comments.
     * @returns {Token|null} The found token.
     */
    getTokenBefore(node, options) {
        assert(this.startMap.has(node.start))

        let skip = 0
        let includeComments = false

        if (typeof options === "number") {
            skip = options | 0
        }
        if (options !== null && typeof options === "object") {
            skip = options.skip | 0
            includeComments = Boolean(options.includeComments)
        }
        assert(skip >= 0)

        const offset = this.startMap.get(node.start)
        const tokens = this.tokens
        if (includeComments) {
            if (offset - skip >= 0) {
                return tokens[offset - skip]
            }
        }
        else {
            for (let i = offset; i >= 0; --i) {
                if (tokens[i].type === "Comment") {
                    continue
                }
                if (skip > 0) {
                    --skip
                    continue
                }

                return tokens[i]
            }
        }

        return null
    }

    /**
     * Get a token after the given node.
     *
     * @param {Node|Token} node - The AST node to get.
     * @param {object} [options] - The option object.
     * @param {number} [options.skip=0] - The number of tokens you skip.
     * @param {number} [options.includeComments=false] - The flag to include comments.
     * @returns {Token|null} The found token.
     */
    getTokenAfter(node, options) {
        assert(this.endMap.has(node.end))

        let skip = 0
        let includeComments = false

        if (typeof options === "number") {
            skip = options | 0
        }
        if (options !== null && typeof options === "object") {
            skip = options.skip | 0
            includeComments = Boolean(options.includeComments)
        }
        assert(skip >= 0)

        const offset = this.endMap.get(node.end)
        const tokens = this.tokens
        if (includeComments) {
            if (offset + skip < tokens.length) {
                return tokens[offset + skip]
            }
        }
        else {
            for (let i = offset; i < tokens.length; ++i) {
                if (tokens[i].type === "Comment") {
                    continue
                }
                if (skip > 0) {
                    --skip
                    continue
                }

                return tokens[i]
            }
        }

        return null
    }
}
