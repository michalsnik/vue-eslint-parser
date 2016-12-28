/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const calcLocEnd = require("./utils").calcLocEnd

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The base class for nodes of HTML.
 */
module.exports = class Node {
    /**
     * @param {string} type - The type.
     * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
     * @param {Node} parent - The parent node.
     * @param {string} code - The whole source code.
     */
    constructor(type, location, parent, code) {
        const start = location.startOffset
        const end = location.endOffset
        const line = location.line
        const column = location.col - 1
        const raw = code.slice(start, end)

        this.parent = parent
        this.type = type
        this.raw = raw
        this.start = start
        this.end = end
        this.range = [start, end]
        this.loc = {start: {line, column}, end: calcLocEnd(raw, line, column)}
    }
}
