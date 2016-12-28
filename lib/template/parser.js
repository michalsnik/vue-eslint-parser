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
const Attribute = require("./attribute")
const ClosingElement = require("./closing-element")
const Element = require("./element")
const Literal = require("./literal")
const OpeningElement = require("./opening-element")
const Token = require("./token")
const TokenStore = require("./token-store")
const utils = require("./utils")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const NON_LT = /[^\r\n\u2028\u2029]/g
const PLACEHOLDER = /{{([\s\S]+?)}}/
const KNOWN_DIRECTIVES = new Set([
    "v-text",
    "v-html",
    "v-show",
    "v-if",
    "v-else",
    "v-else-if",
    "v-for",
    "v-on",
    "v-bind",
    "v-model",
    "v-pre",
    "v-cloak",
    "v-once",
])

class TemplateParser {
    constructor(code, scriptParser) {
        this.code = code
        this.scriptParser = scriptParser
        this.tokens = new TokenStore()
        this.stack = []
    }

    get currentNode() {
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - 1]
        }
        return null
    }

    parseExpression(start, end) {
        const prefix = this.code.slice(0, start - 1).replace(NON_LT, " ")
        const expressionCode = this.code.slice(start, end)
        const code = `${prefix}(${expressionCode})`
        const program = this.scriptParser.parseScript(code)
        const ast = program.body[0]
        const tokens = program.tokens

        // Remove parentheses and merge comments.
        postprocessTokensOfExpression(tokens, program.comments)

        return {ast, tokens}
    }

    visit(ast) {
        switch (ast.nodeName) {
            case "#document":
            case "#document-fragment":
            case "#documentType":
                assert(false, "Those should not be appeared")
                break

            case "#comment":
                this.visitCommentNode(ast)
                break
            case "#text":
                this.visitTextNode(ast)
                break
            default:
                this.visitElement(ast)
                break
        }
    }

    visitCommentNode(ast) {
        const value = ast.data
        const location = ast.__location
        const token = Token.fromP5("BlockComment", value, location)

        this.tokens._add(token)
    }

    visitTextNode(ast) {
        let offset = ast.__location.startOffset
        let line = ast.__location.line
        let col = ast.__location.col
        let text = this.code.slice(offset, ast.__location.endOffset)

        while (text) {
            const match = PLACEHOLDER.exec(text)

            if (match == null) {
                this.commitTextNode(text, offset, line, col)
                break
            }

            if (match.index !== 0) {
                const node = this.commitTextNode(
                    text.slice(0, match.index),
                    offset,
                    line,
                    col
                )
                offset = node.end
                line = node.loc.end.line
                col = node.loc.end.column + 1
                text = text.slice(match.index)
            }

            const node = this.commitContainerExpression(
                match[1],
                offset,
                line,
                col
            )
            offset = node.end
            line = node.loc.end.line
            col = node.loc.end.column + 1
            text = text.slice(match.length)
        }
    }

    commitTextNode(text, offset, line, col) {
        const startOffset = offset
        const endOffset = offset + text.length
        const location = {startOffset, endOffset, line, col}
        const token = Token.fromP5("Text", text, location)
        const node = new Literal(token)

        this.tokens._add(token)
        this.currentNode.children.push(node)

        return node
    }

    commitContainerExpression(text, offset, line, col) {
        const token1 = new Token(
            "Punctuator",
            "{{",
            "{{",
            offset,
            offset + 2,
            {
                start: {line, column: col - 1},
                end: {line, column: col + 1},
            }
        )
        const token2 = new Token(
            "Punctuator",
            "{{",
            "{{",
            token1.end,
            token1.end + text.length,
            {
                start: {line, column: col - 1},
                end: {line, column: col + 1},
            }
        )
        const token1 = new Token(
            "Punctuator",
            "{{",
            "{{",
            offset,
            offset + 2,
            {
                start: {line, column: col - 1},
                end: {line, column: col + 1},
            }
        )
        const tokens = [,
            new Token(
                "Punctuator",
                "}}",
                "}}",
                offset + 2 + text.length,
                offset + 4 + text.length,
                {
                    start: {line, column: col - 1},
                    end: {line, column: col + 1},
                }
            ),
        ]
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------
