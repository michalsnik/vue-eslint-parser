/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const debug = require("debug")("vue-eslint-parser")
const entities = require("entities")
const sortedIndex = require("lodash.sortedindex")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const LT = /(?:\r\n|[\r\n\u2028\u2029])/g
const NON_LT = /[^\r\n\u2028\u2029]/g
const MUSTACHE = /\{\{.+?}}/g
const DIRECTIVE_NAME = /^(?:v-|[:@]).+[^.:@]$/
const QUOTES = /^["']$/
const SPACE = /\s/

// 'u' flag has not supported in Node v4.
// https://html.spec.whatwg.org/#attributes-2
const INVALID_CHARS = /[\u0000-\u001F\u007F-\u009F\u0020\u0022\u0027\u003E\u002F\u003D\uFDD0-\uFDEF\uFFFE\uFFFF]/
const INVALID_PAIRS = new Set("\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}")

/**
 * Create the array of the offsets of line headings.
 * @param {string} text The text to detect line headings.
 * @returns {number[]} The offsets of line headings.
 */
function getHeadOffsets(text) {
    const retv = []
    let match = null

    LT.lastIndex = 0
    while ((match = LT.exec(text)) != null) {
        retv.push(match.index + match[0].length)
    }

    return retv
}

/**
 * Normalize the visited result of child nodes.
 * @param {(ASTNode|IterableIterator<ASTNode>|null)[]} xs The nodes to normalize.
 * @returns {ASTNode[]} The normalize array.
 */
function normalizeChildNodes(xs) {
    const ys = []
    for (const x of xs) {
        if (x == null) {
            // Do nothing.
            // It was a comment node.
        }
        else if (Symbol.iterator in x) {
            for (const x0 of x) {
                ys.push(x0)
            }
        }
        else {
            ys.push(x)
        }
    }
    return ys
}

/**
 * The transformer of HTML AST.
 * Input is the AST of `parse5` package.
 * Output is ESTree-like AST.
 */
class HTMLTransformer {
    /**
     * Transform the given parse5's AST to ESTree-like AST.
     * @param {module:parse5.AST.Node} ast The template element to transform.
     * @param {string} text The whole source code.
     * @param {function} parseScript The function to parse inline scripts.
     * @param {object} options The option to transform.
     * @returns {ASTNode} The transformation result.
     */
    static transform(ast, text, parseScript, options) {
        const transformer = new HTMLTransformer(text, parseScript, options)
        const transformed = transformer.visit(ast)

        transformed.tokens = transformer.tokens
        transformed.comments = transformer.comments

        return transformed
    }

    /**
     * Initialize this transformer.
     * @param {string} text The source code text to transform.
     * @param {function} parseScript The function to parse inline scripts.
     * @param {object} options The options to transform. Nothing for now.
     */
    constructor(text, parseScript, options) {
        this.text = text
        this.parseScript = parseScript
        this.options = options || {}
        this.headOffsets = getHeadOffsets(text)
        this.tokens = []
        this.comments = []
    }

    /**
     * Get line/column pair of the given offset.
     * @param {number} offset The offset to get line/column pair.
     * @returns {{line: number, column: number}} line/column pair.
     */
    getLocPart(offset) {
        const line = 1 + sortedIndex(this.headOffsets, offset + 1)
        const column = offset - (line === 1 ? 0 : this.headOffsets[line - 2])

        return {line, column}
    }

    /**
     * Get the pair of line/column pair of the given offsets.
     * @param {number} start The start offset to get line/column pair.
     * @param {number} end The end offset to get line/column pair.
     * @returns {{start:{line: number, column: number}, end:{line: number, column: number}}} The pair of line/column pair.
     */
    getLoc(start, end) {
        return {
            start: this.getLocPart(start),
            end: this.getLocPart(end),
        }
    }

    /**
     * Check the character of the given offset is valid as a part of attribute name.
     * @param {number} offset The offset to check.
     * @returns {boolean} `true` if the character is valid.
     */
    isValidChar(offset) {
        return !(
            INVALID_CHARS.test(this.text[offset]) ||
            INVALID_PAIRS.has(this.text.slice(offset, offset + 2))
        )
    }

    /**
     * Get the offset at the 1st valid characters after the given offset.
     * @param {number} offset The offset to get.
     * @returns {number} The 1st valid characters after the given offset.
     */
    getIdentifierStart(offset) {
        let i = offset
        while (!this.isValidChar(i)) {
            i += 1
        }
        return i
    }

    /**
     * Get the offset at the 1st valid characters before the given offset.
     * @param {number} offset The offset to get.
     * @returns {number} The 1st valid characters before the given offset.
     */
    getIdentifierEnd(offset) {
        let i = offset - 1
        while (!this.isValidChar(i)) {
            i -= 1
        }
        return i + 1
    }

    /**
     * Get the offset at the 1st valid characters after the given offset.
     * @param {number} offset The offset to get.
     * @returns {number} The 1st valid characters after the given offset.
     */
    getInlineScriptStart(offset) {
        let i = offset
        while (SPACE.test(this.text[i])) {
            i += 1
        }
        return i
    }

    /**
     * Get the offset at the 1st valid characters before the given offset.
     * @param {number} offset The offset to get.
     * @returns {number} The 1st valid characters before the given offset.
     */
    getInlineScriptEnd(offset) {
        let i = offset - 1
        while (SPACE.test(this.text[i])) {
            i -= 1
        }
        return i + 1
    }

    /**
     * Create and append new token.
     * If the `end` is before `start`, this returns `null`.
     * @param {string} type The token type.
     * @param {number} start The start offset of the token.
     * @param {number} end The end offset of the token.
     * @returns {ASTNode|null} The created token.
     */
    appendToken(type, start, end) {
        if (start >= end) {
            return null
        }

        const token = {
            type,
            range: [start, end],
            loc: this.getLoc(start, end),
            value: this.text.slice(start, end),
        }
        this.tokens.push(token)

        return token
    }

    /**
     * Add the specific node into the children of the current node.
     * @param {ASTNode} node The transformed node to add.
     * @returns {ASTNode} The node.
     */
    appendNode(node) {
        if (this.currentNode == null) {
            this.rootNode = this.currentNode = node
        }
        else {
            this.currentNode.children.push(node)
        }

        return node
    }

    /**
     * Create new HTMLText node.
     * @param {number} start The start offset to add.
     * @param {number} end The end offset to add.
     * @returns {ASTNode} The created node.
     */
    createHTMLText(start, end) {
        return this.appendToken("HTMLText", start, end)
    }

    /**
     * Create new HTMLExpressionContainer node.
     * @param {number} start The start offset to add.
     * @param {number} end The end offset to add.
     * @param {number} quoteSize The size quotations.
     * @returns {ASTNode} The created node.
     */
    createHTMLExpressionContainer(start, end, quoteSize) {
        this.appendToken("Punctuator", start, start + quoteSize)

        const codeStart = this.getInlineScriptStart(start + quoteSize)
        const codeEnd = this.getInlineScriptEnd(end - quoteSize)
        const prefix = this.text.slice(0, codeStart - 1).replace(NON_LT, " ")
        const code = entities.decodeHTML(
            this.text.slice(codeStart, codeEnd)
        )

        let expression = null
        let syntaxError = null
        try {
            const ast = this.parseScript(`${prefix}(${code})`)
            const tokens = ast.tokens || []
            const comments = ast.comments || []

            tokens.pop()
            tokens.shift()
            Array.prototype.push.apply(this.tokens, tokens)
            Array.prototype.push.apply(this.comments, comments)

            expression = ast.body[0].expression
        }
        catch (error) {
            syntaxError = error
        }

        this.appendToken("Punctuator", end - quoteSize, end)
        return {
            type: "HTMLExpressionContainer",
            range: [start, end],
            loc: this.getLoc(start, end),
            expression,
            syntaxError,
        }
    }

    /**
     * Create new HTMLIdentifier node.
     * @param {number} start The start offset to create.
     * @param {number} end The end offset to create.
     * @returns {ASTNode} The created node.
     */
    createHTMLIdentifier(start, end) {
        const idStart = this.getIdentifierStart(start)
        let idEnd = 0

        if (end === undefined) {
            idEnd = idStart + 1
            while (this.isValidChar(idEnd)) {
                idEnd += 1
            }
        }
        else {
            idEnd = this.getIdentifierEnd(end)
        }

        const token = this.appendToken("HTMLIdentifier", idStart, idEnd)
        return {
            type: token.type,
            range: token.range,
            loc: token.loc,
            name: token.value,
        }
    }

    /**
     * Create new HTMLDirectiveKey node.
     * @param {number} start The start offset to create.
     * @param {number} end The end offset to create.
     * @returns {ASTNode} The created node.
     */
    createHTMLDirectiveKey(start, end) {
        this.appendToken("HTMLIdentifier", start, end)

        let name = null
        let argument = null
        let modifiers = null
        let shorthand = false
        let remain = this.text.slice(start, end)

        if (remain.startsWith(":") || remain.startsWith("@")) {
            name = remain[0]
            shorthand = true
            remain = remain.slice(1)
        }
        else {
            const colon = remain.indexOf(":")
            if (colon !== -1) {
                name = remain.slice(0, colon)
                remain = remain.slice(colon + 1)
            }
        }

        const dotSplit = remain.split(".")
        if (name == null) {
            name = dotSplit[0]
        }
        else {
            argument = dotSplit[0]
        }
        modifiers = dotSplit.slice(1)

        if (name.startsWith("v-")) {
            name = name.slice(2)
        }

        return {
            type: "HTMLDirectiveKey",
            range: [start, end],
            loc: this.getLoc(start, end),
            name,
            argument,
            modifiers,
            shorthand,
        }
    }

    /**
     * Create new HTMLAttributeValue node.
     * @param {number} start The start offset to create.
     * @param {number} end The end offset to create.
     * @param {string} value The value string which came from parse5.
     * @returns {ASTNode} The created node.
     */
    createHTMLAttributeValue(start, end, value) {
        const literal = this.appendToken("HTMLAttributeValue", start, end)
        return {
            type: literal.type,
            range: literal.range,
            loc: literal.loc,
            value,
            raw: literal.value,
        }
    }

    /**
     * Create new HTMLAttribute node.
     * @param {string} name The attribute name which came from parse5.
     * @param {string} value The attribute value which came from parse5.
     * @param {module:parse5.AST.LocationInfo} location The location info.
     * @returns {ASTNode} The created node.
     */
    createHTMLAttribute(name, value, location) {
        const directive = DIRECTIVE_NAME.test(name)
        const start = location.startOffset
        const end = location.endOffset
        let i = start

        // Advance to `=`.
        while (i < end && this.text[i] !== "=") {
            i += 1
        }

        // Make the key.
        const keyNode = directive
            ? this.createHTMLDirectiveKey(start, this.getIdentifierEnd(i))
            : this.createHTMLIdentifier(start, i)
        let valueNode = null

        if (i !== end) {
            this.appendToken("Punctuator", i, i + 1)

            // Advance to the start of the value.
            do {
                i += 1
            } while (i < end && SPACE.test(i))

            // Make the value.
            const quoteSize = QUOTES.test(this.text[i]) ? 1 : 0
            valueNode = directive
                ? this.createHTMLExpressionContainer(i, end, quoteSize)
                : this.createHTMLAttributeValue(i, end, value)
        }

        return {
            type: "HTMLAttribute",
            range: [start, end],
            loc: this.getLoc(start, end),
            key: keyNode,
            value: valueNode,
        }
    }

    /**
     * Create new HTMLStartTag node.
     * @param {module:parse5.AST.Element} node The element node to create.
     * @returns {ASTNode} The created node.
     */
    createHTMLStartTag(node) {
        const location = node.__location.startTag || node.__location
        const start = location.startOffset
        const end = location.endOffset
        const selfClosing = (this.text[end - 2] === "/")
        const attrs = node.attrs
        const attrLocs = node.__location.attrs
        const attributes = []

        this.appendToken("Punctuator", start, start + 1)

        const id = this.createHTMLIdentifier(start + 1)
        for (const attr of attrs) {
            const name = attr.name
            const value = attr.value
            const attrLoc = attrLocs[name]

            attributes.push(this.createHTMLAttribute(name, value, attrLoc))
        }

        this.appendToken("Punctuator", end - (selfClosing ? 2 : 1), end)

        return {
            type: "HTMLStartTag",
            range: [start, end],
            loc: this.getLoc(start, end),
            id,
            attributes,
            selfClosing,
        }
    }

    /**
     * Create new HTMLEndTag node.
     * @param {module:parse5.AST.Element} node The element node to create.
     * @returns {ASTNode} The created node.
     */
    createHTMLEndTag(node) {
        const location = node.__location.endTag
        if (location == null) {
            return null
        }
        const start = location.startOffset
        const end = location.endOffset

        this.appendToken("Punctuator", start, start + 2)
        const id = this.createHTMLIdentifier(start + 2, end - 1)
        this.appendToken("Punctuator", end - 1, end)

        return {
            type: "HTMLEndTag",
            range: [start, end],
            loc: this.getLoc(start, end),
            id,
        }
    }

    /**
     * Transform the given parse5's comment node.
     * @param {module:parse5.AST.CommentNode} node The comment node to transform.
     * @returns {null} The comment node is dropped from AST.
     */
    visitCommentNode(node) {
        const start = node.__location.startOffset
        const end = node.__location.endOffset
        const comment = {
            type: "HTMLComment",
            range: [start, end],
            loc: this.getLoc(start, end),
            value: this.text.slice(start + 4, end - 3),
        }

        this.comments.push(comment)

        return null
    }

    /**
     * Transform the given parse5's text node.
     * If there are mustaches, the transformation result is multiple.
     * @param {module:parse5.AST.TextNode} node The text node to transform.
     * @returns {ASTNode[]} The transformed nodes.
     */
    visitTextNode(node) {
        const retv = []
        const start = node.__location.startOffset
        const end = node.__location.endOffset
        const text = this.text.slice(start, end)
        let lastIndex = start
        let match = null

        MUSTACHE.lastIndex = 0
        while ((match = MUSTACHE.exec(text)) != null) {
            const ecStart = start + match.index
            const ecEnd = ecStart + match[0].length

            if (lastIndex !== ecStart) {
                retv.push(this.createHTMLText(lastIndex, ecStart))
            }
            retv.push(this.createHTMLExpressionContainer(ecStart, ecEnd, 2))

            lastIndex = ecEnd
        }
        if (lastIndex !== end) {
            retv.push(this.createHTMLText(lastIndex, end))
        }

        return retv
    }

    /**
     * Transform the given parse5's element node.
     * @param {module:parse5.AST.Element} node The element node to transform.
     * @returns {ASTNode} The transformed node.
     */
    visitElementNode(node) {
        const childNodes = (node.tagName === "template")
            ? node.content.childNodes
            : node.childNodes

        return {
            type: "HTMLElement",
            startTag: this.createHTMLStartTag(node),
            children: normalizeChildNodes(childNodes.map(this.visit, this)),
            endTag: this.createHTMLEndTag(node),
        }
    }

    /**
     * Visit the given node to transform.
     * This is recursive.
     * @param {module:parse5.AST.Node} node The parse5's node to visit.
     * @returns {ASTNode|ASTNode[]} The transformed node.
     */
    visit(node) {
        if (node.nodeName === "#comment") {
            return this.visitCommentNode(node)
        }
        if (node.nodeName === "#text") {
            return this.visitTextNode(node)
        }
        if (!node.nodeName.startsWith("#")) {
            return this.visitElementNode(node)
        }

        debug("A node which is unknown type '%s' was ignored.", node.nodeName)
        return null
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = HTMLTransformer.transform
