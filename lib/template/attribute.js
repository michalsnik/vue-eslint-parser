/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Node = require("./node")
const calcLocEnd = require("./utils").calcLocEnd

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const AROUND_EQ = /[ \t\r\n\f]*=[ \t\r\n\f]*/

/**
 * Create `AttributeName` node.
 *
 * @param {string} name - The name.
 * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
 * @param {Node} parent - The parent node.
 * @param {string} code - The whole source code.
 * @returns {AttributeName} The create node.
 */
function createName(name, location, parent, code) {
    return new AttributeName(
        name,
        {
            startOffset: location.startOffset,
            endOffset: location.startOffset + name.length,
            line: location.line,
            col: location.col,
        },
        parent,
        code
    )
}

/**
 * Create `Literal` node.
 *
 * @param {string} value - The value.
 * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
 * @param {Node} parent - The parent node.
 * @param {string} code - The whole source code.
 * @returns {AttributeName} The create node.
 */
function createValue(value, location, parent, code) {
    const match = AROUND_EQ.exec(parent.raw)
    if (match == null) {
        return null
    }

    const start = location.startOffset + match.index + match.length
    const startLoc = calcLocEnd(
        parent.raw.slice(0, start),
        location.line,
        location.column - 1
    )

    return new Literal(
        value,
        {
            startOffset: start,
            endOffset: location.endOffset,
            line: startLoc.line,
            col: startLoc.col,
        },
        parent,
        code
    )
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The class for attribute node.
 * This is used for attributes.
 */
module.exports = class Attribute extends Node {
    /**
     * @param {string} name - The name.
     * @param {string} value - The value.
     * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
     * @param {Node} parent - The parent node.
     * @param {string} code - The whole source code.
     */
    constructor(name, value, location, parent, code) {
        super("Attribute", location, parent, code)

        this.name = name
        this.value = value
    }
}
