# AST for `<template lang="html">`

Some types are featured from [ESTree].

- [Program]
- [Node]
- [Expression]
- [Literal]
- [Pattern]

## Node

```js
extend interface Node {
    range: [ number ]
}
```

This AST spec enhances the [Node] nodes as same as ESLint.
The `range` property is an array which has 2 integers.
The 1st integer is the offset of the start location of the node.
The 3st integer is the offset of the end location of the node.

## HTMLIdentifier

```js
interface HTMLIdentifier <: Node {
    type: "HTMLIdentifier"
    name: string
}
```

- The `name` property can include any characters except U+0000-U+001F, U+007F-U+009F,
  U+0020, U+0022, U+0027, U+003E, U+002F, U+003D, U+FDD0-U+FDEF, U+FFFE, U+FFFF,
  U+1FFFE, U+1FFFF, U+2FFFE, U+2FFFF, U+3FFFE, U+3FFFF, U+4FFFE, U+4FFFF, U+5FFFE,
  U+5FFFF, U+6FFFE, U+6FFFF, U+7FFFE, U+7FFFF, U+8FFFE, U+8FFFF, U+9FFFE, U+9FFFF,
  U+AFFFE, U+AFFFF, U+BFFFE, U+BFFFF, U+CFFFE, U+CFFFF, U+DFFFE, U+DFFFF, U+EFFFE,
  U+EFFFF, U+FFFFE, U+FFFFF, U+10FFFE or U+10FFFF.

## HTMLText

```js
interface HTMLText <: Node {
    type: "HTMLText"
    value: string
}
```

- Plain text of HTML.

## HTMLExpressionContainer

```js
interface HTMLExpressionContainer <: Node {
    type: "HTMLExpressionContainer"
    expression: Expression | null
    syntaxError: Error | null
}
```

- If syntax errors exist, `expression` is `null` and `syntaxError` is an error object. Otherwise, `expression` is an [Expression] node and `syntaxError` is `null`.

## HTMLDirectiveKey

```js
interface HTMLDirectiveKey <: Node {
    type: "HTMLDirectiveKey"
    name: string
    argument: string | null
    modifiers: [ string ]
    shorthand: boolean
}
```

- The `name` property doesn't have `v-` prefix. It's dropped.
- In the shorthand of `v-bind` cases, the `id` property is `":"` and the `shorthand` property is `true`.
- In the shorthand of `v-on` cases, the `id` property is `"@"` and the `shorthand` property is `true`.
- Otherwise, `shorthand` property is always `false`.

## HTMLAttributeValue

```js
interface HTMLAttributeValue <: Node {
    type: "HTMLAttributeValue"
    value: string
    raw: string
}
```

- This is similar to [Literal] nodes but this is not always quoted.

## HTMLAttribute

```js
interface HTMLAttribute <: Node {
    type: "HTMLAttribute"
    directive: boolean
    key: HTMLIdentifier | HTMLDirectiveKey
    value: HTMLAttributeValue | HTMLExpressionContainer | null
}
```

- If the `directive` property is `true`, this is a directive of Vue.js.  
  In that case, the `id` property is a `HTMLDirectiveKey` node and the `value` property is a `HTMLExpressionContainer` node.
- Otherwise, the `id` property is a `HTMLIdentifier` node and the `value` property is a `HTMLAttributeValue` node.
- If the `value` property is `null`, their attribute value does not exist.

## HTMLStartTag

```js
interface HTMLStartTag <: Node {
    type: "HTMLStartTag"
    id: HTMLIdentifier
    attributes: [ HTMLAttribute ]
    selfClosing: boolean
}
```

If `selfClosing` is `true`, it means having `/`. E.g. `<br/>`.

## HTMLEndTag

```js
interface HTMLEndTag <: Node {
    type: "HTMLEndTag"
    id: HTMLIdentifier
}
```

## HTMLElement

```js
interface HTMLElement <: Node {
    type: "HTMLElement"
    startTag: HTMLStartTag
    children: [ HTMLText | HTMLExpressionContainer | HTMLElement ]
    endTag: HTMLEndTag | null
}
```

If `startTag.selfClosing` is `false` and `endTag` is `null`, the element does not have their end tag. E.g. `<li>Foo.`.

## Program

```js
extend interface Program {
    templateBody: Node | null
}
```

This spec enhances [Program] nodes as it has the root node of `<template>`.
This supports only HTML for now. However, I'm going to add other languages Vue.js supports. The AST of other languages may be different form to HTMLElement.

[ESTree]:     https://github.com/estree/estree
[Program]:    https://github.com/estree/estree/blob/master/es5.md#programs
[Node]:       https://github.com/estree/estree/blob/master/es5.md#node-objects
[Expression]: https://github.com/estree/estree/blob/master/es5.md#expression
[Literal]:    https://github.com/estree/estree/blob/master/es5.md#literal
[Pattern]:    https://github.com/estree/estree/blob/master/es5.md#patterns
