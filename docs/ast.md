# AST for `<template>`

Some types are featured from [ESTree](https://github.com/estree/estree).

- [Node](https://github.com/estree/estree/blob/master/es5.md#node-objects)
- [Expression](https://github.com/estree/estree/blob/master/es5.md#expression)
- [Literal](https://github.com/estree/estree/blob/master/es5.md#literal)

## Attribute

```js
interface Attribute <: Node {
    type: "Attribute",
    directive: false,
    name: string,
    value: string | null
}

interface Directive <: Attribute {
    type: "Attribute",
    directive: true,
    expression: Expression | null,
    argument: string | null,
    modifiers: object
}

interface VForDirective <: Directive {
    type: "Attribute",
    identifiers: [ Identifier ]
}
```

## OpeningElement

```js
interface OpeningElement <: Node {
    type: "OpeningElement"
}
```

## ClosingElement

```js
interface ClosingElement <: Node {
    type: "ClosingElement"
}
```

## ExpressionContainer

```js
interface ExpressionContainer <: Node {
    type: "ExpressionContainer",
    expression: Expression | null
    syntaxError: Error | null
}
```

## Element

```js
interface Element <: Node {
    type: "Element",
    name: string,
    openingElement: OpeningElement,
    closingElement: ClosingElement | null,
    attributes: [ Attribute ],
    children: [Literal | ExpressionContainer | Element]
}
```
