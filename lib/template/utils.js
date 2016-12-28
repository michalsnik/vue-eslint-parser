/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const LINE_TERMINATORS = /\r\n|\r|\n|\u2028|\u2029/g

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    LINE_TERMINATORS,

    /**
     * Calculates the end location.
     *
     * @param {string} raw - The text of the target token.
     * @param {number} startLine - The start line of the target token.
     * @param {number} startColumn - The start column of the target token.
     * @returns {{line: number, column: number}} The end location.
     */
    calcLocEnd(raw, startLine, startColumn) {
        const lines = raw.split(LINE_TERMINATORS)
        const line = startLine + lines.length - 1
        const column = (lines.length === 1)
            ? startColumn + raw.length
            : lines[lines.length - 1].length

        return {line, column}
    },
}
