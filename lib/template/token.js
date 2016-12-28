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
 * The token.
 */
module.exports = class Token {
    /**
     * @param {string} type - The type.
     * @param {string} value - The value.
     * @param {string} raw - The raw value.
     * @param {number} start - The start index (0-based).
     * @param {number} end - The end index (0-based).
     * @param {{start: {line: number, column: number}, end: {line: number, column: number}}} loc - The location info of this token.
     */
    constructor(type, value, raw, start, end, loc) {
        this.type = type
        this.value = value
        this.raw = raw
        this.start = start
        this.end = end
        this.range = [start, end]
        this.loc = loc
    }

    /**
     * @param {string} type - The type.
     * @param {string} value - The value.
     * @param {{startOffset: number, endOffset: number, line: number, col: number}} location - The location object of parse5.
     * @param {string} code - The whole source code.
     * @returns {Token} The created token.
     */
    static fromP5(type, value, location, code) {
        const start = location.startOffset
        const end = location.endOffset
        const line = location.line
        const column = location.col - 1
        const raw = code.slice(start, end)

        return new Token(
            type,
            value,
            raw,
            start,
            end,
            {
                start: {line, column},
                end: calcLocEnd(raw, line, column),
            }
        )
    }
}
