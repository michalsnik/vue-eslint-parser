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
 * The class for closing element node.
 */
module.exports = class ClosingElement extends Node {
    /**
     * @param {object} node - The AST of parse5's Element.
     * @param {Node} parent - The parent node.
     * @param {string} code - The whole source code.
     */
    constructor(node, parent, code) {
        super("ClosingElement", node.__location.endTag, parent, code)
    }
}
