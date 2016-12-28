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

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The class for literal node.
 * This is used for the value of attributes.
 */
module.exports = class Literal extends Node {
    /**
     * @param {string} value - The string value.
     * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
     * @param {Node} parent - The parent node.
     * @param {string} code - The whole source code.
     */
    constructor(value, location, parent, code) {
        super("Literal", location, parent, code)
        this.value = value
    }
}
