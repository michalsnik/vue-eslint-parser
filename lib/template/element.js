/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Attribute = require("./attribute")
const ClosingElement = require("./closing-element")
const Node = require("./node")
const OpeningElement = require("./opening-element")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const PLACEHOLDER = /{{(.+?)}}/
const pushAll = Function.apply.bind(Array.prototype.push)

/**
 * The class for element node.
 */
class Element extends Node {
    /**
     * @param {object} node - The AST of parse5's Element.
     * @param {Node} parent - The parent node.
     * @param {string} code - The whole source code.
     */
    constructor(node, parent, code) {
        super("Element", node.__location, parent, code)
        this.name = node.nodeName
        this.openingElement = new OpeningElement(node, this, code)
        this.closingElement = (node.__location.endTag == null)
            ? null
            : new ClosingElement(node, this, code)
        this.attributes = []
        this.children = []

        processAttributes(node, this, code)
        processChildren(node, this, code)
    }
}

/**
 * Transform the AST of attributes.
 *
 * @param {object} node - The AST of parse5's Element.
 * @param {Element} parent - The parent node.
 * @param {string} code - The whole source code.
 * @returns {void}
 */
function processAttributes(node, parent, code) {
    const data = node.attrs
    const location = node.__location.attrs

    for (const name of Object.keys(data)) {
        parent.attributes.push(
            new Attribute(
                name,
                data[name].value,
                parent,
                location[name],
                code
            )
        )
    }
}

/**
 * Transform the AST of child nodes.
 *
 * @param {object} node - The AST of parse5's Element.
 * @param {Element} parent - The parent node.
 * @param {string} code - The whole source code.
 * @returns {void}
 */
function processChildren(node, parent, code) {
    const childNodes = node.nodeName === "template"
        ? node.content.childNodes
        : node.childNodes

    for (const childNode of childNodes) {
        const type = childNode.nodeName
        if (type === "#text") {
            pushAll(
                parent.children,
                parseText(childNode, parent, code)
            )
        }
        else if (type[0] !== "#") {
            parent.children.push(
                new Element(childNode, parent, code)
            )
        }
    }
}

function parseText(node, parent, code) {
    const retv = []
    const location = node.__location
    // let startOffset = location.startOffset
    // let endOffset = location.endOffset
    // let line = location.line
    // let col = location.col
    // let text = code.slice(startOffset, endOffset)

    for (;;) {
        const match = PLACEHOLDER.exec(text)

        if (match == null) {
            retv.push(
                new Literal(text, {startOffset, endOffset, line, col})
            )
            break
        }
        if (match.index !== 0) {
        }
    }

    return retv
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Element
